package no.dcat.harvester.crawler.handlers;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import no.dcat.harvester.CatalogHarvestRecord;
import no.dcat.harvester.crawler.CrawlerResultHandler;
import no.dcat.harvester.crawler.DatasetHarvestRecord;
import no.dcat.harvester.crawler.ValidationStatus;
import no.dcat.shared.Dataset;
import no.dcat.shared.Subject;
import no.difi.dcat.datastore.Elasticsearch;
import no.difi.dcat.datastore.domain.DcatSource;
import no.difi.dcat.datastore.domain.dcat.Distribution;
import no.difi.dcat.datastore.domain.dcat.builders.DcatReader;
import org.apache.jena.rdf.model.Model;
import org.elasticsearch.action.bulk.BulkRequestBuilder;
import org.elasticsearch.action.bulk.BulkResponse;
import org.elasticsearch.action.index.IndexRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;


/**
 * Handles harvesting of dcat data sources, and saving them into elasticsearch
 */
public class ElasticSearchResultHandler implements CrawlerResultHandler {

    public static final String DCAT_INDEX = "dcat";
    public static final String SUBJECT_TYPE = "subject";
    public static final String DATASET_TYPE = "dataset";
    private final Logger logger = LoggerFactory.getLogger(ElasticSearchResultHandler.class);

    String hostename;
    int port;
    String clustername;
    private final String themesHostname;
    String httpUsername;
    String httpPassword;


    /**
     * Creates a new elasticsearch code result handler connected to
     * a particular elasticsearch instance.
     *
     * @param hostname host name where elasticsearch cluster is found
     * @param port port for connection to elasticserach cluster. Usually 9300
     * @param clustername Name of elasticsearch cluster
     */
    public ElasticSearchResultHandler(String hostname, int port, String clustername, String themesHostname, String httpUsername, String httpPassword) {
        this.hostename = hostname;
        this.port = port;
        this.clustername = clustername;
        this.themesHostname = themesHostname;
        this.httpUsername = httpUsername;
        this.httpPassword = httpPassword;

        logger.debug("ES clustername: " + this.clustername);
    }


    /**
     * Process a data catalog, represented as an RDF model
     *
     * @param dcatSource information about the source/provider of the data catalog
     * @param model RDF model containing the data catalog
     */
    @Override
    public void process(DcatSource dcatSource, Model model, List<String> validationResults) {
        logger.debug("Processing results Elasticsearch: " + this.hostename +":" + this.port + " cluster: "+ this.clustername);

        try (Elasticsearch elasticsearch = new Elasticsearch(hostename, port, clustername)) {
            logger.trace("Start indexing");
            indexWithElasticsearch(dcatSource, model, elasticsearch, validationResults);
        } catch (Exception e) {
            logger.error("Exception: " + e.getMessage(), e);
            throw e;
        }
        logger.trace("finished");
    }

    /**
     * Index data catalog with Elasticsearch
     * @param dcatSource information about the source/provider of the data catalog
     * @param model RDF model containing the data catalog
     * @param elasticsearch The Elasticsearch instance where the data catalog should be stored
     */
    void indexWithElasticsearch(DcatSource dcatSource, Model model, Elasticsearch elasticsearch, List<String> validationResults) {
        Gson gson = new GsonBuilder().setPrettyPrinting().setDateFormat("yyyy-MM-dd'T'HH:mm:ssX").create();

        if (!elasticsearch.indexExists(DCAT_INDEX)) {
            logger.warn("Creating index: " + DCAT_INDEX);
            elasticsearch.createIndex(DCAT_INDEX);
        }else{
            logger.debug("Index exists: " + DCAT_INDEX);
        }

        logger.debug("Preparing bulkRequest");
        BulkRequestBuilder bulkRequest = elasticsearch.getClient().prepareBulk();

        DcatReader reader = new DcatReader(model, themesHostname, httpUsername, httpPassword);

        List<Subject> subjects = reader.getSubjects();
        List<Subject> filteredSubjects = subjects.stream().filter(s ->
                s.getPrefLabel() != null && s.getDefinition() != null && !s.getPrefLabel().isEmpty() && !s.getDefinition().isEmpty())
                .collect(Collectors.toList());;
        logger.info("Total number of unique subject uris {} in dcat source {}.", subjects.size(), dcatSource.getId());
        logger.info("Adding {} subjects with prefLabel and definition to elastic", filteredSubjects.size());

        for (Subject subject : filteredSubjects) {

            IndexRequest indexRequest = new IndexRequest(DCAT_INDEX, SUBJECT_TYPE, subject.getUri());
            indexRequest.source(gson.toJson(subject));

            logger.debug("Add subject document {} to bulk request", subject.getUri());
            bulkRequest.add(indexRequest);
        }

        Date harvestTime = new Date();

        IndexRequest catalogCrawlRequest = new IndexRequest("harvest", "catalog");
        CatalogHarvestRecord catalogRecord = new CatalogHarvestRecord();
        dcatSource.getLastHarvest().ifPresent(harvest -> {
            catalogRecord.setMessage(harvest.getMessage());
            catalogRecord.setStatus(harvest.getStatus().toString());
        });
        List<String> catalogValidationMessages = validationResults.stream().filter(m ->
                m.contains("classname='Catalog'")).collect(Collectors.toList());

        catalogRecord.setHarvestUrl(dcatSource.getUrl());
        catalogRecord.setDataSourceId(dcatSource.getId());
        catalogRecord.setDate(harvestTime);
        catalogRecord.setValidationMessages(catalogValidationMessages);

        catalogCrawlRequest.source(gson.toJson(catalogRecord));
        bulkRequest.add(catalogCrawlRequest);

        List<Dataset> datasets = reader.getDatasets();
        logger.info("Number of dataset documents {} for dcat source {}", datasets.size(), dcatSource.getId());
        for (Dataset dataset : datasets) {

            IndexRequest indexRequest = new IndexRequest(DCAT_INDEX, DATASET_TYPE, dataset.getId());
            indexRequest.source(gson.toJson(dataset));

            DatasetHarvestRecord record = new DatasetHarvestRecord();
            record.setDatasetId(dataset.getId()); // todo fix datasetid?
            record.setDatasetUri(dataset.getUri());
            record.setCatalogHarvestRecordId(dcatSource.getId());
            record.setDataset(dataset);
            record.setDate(harvestTime);

            List<String> messages = validationResults.stream().filter(m ->
                    m.contains(dataset.getUri()) && m.contains("classname='Dataset'")).collect(Collectors.toList());

            if (messages != null && !messages.isEmpty()) {
                ValidationStatus vs = new ValidationStatus();
                vs.setWarnings((int) messages.stream().filter(m -> m.contains("validation_warning")).count());
                vs.setErrors((int) messages.stream().filter(m -> m.contains("validation_error")).count());
                vs.setValidationMessages(messages);
                record.setValidationStatus(vs);
            }

            IndexRequest indexHarvestRequest = new IndexRequest("harvest", "dataset");
            indexHarvestRequest.source(gson.toJson(record));

            logger.debug("Add dataset document {} to bulk request", dataset.getId());
            bulkRequest.add(indexRequest);
            bulkRequest.add(indexHarvestRequest);
        }



        BulkResponse bulkResponse = bulkRequest.execute().actionGet();
        if (bulkResponse.hasFailures()) {
            //TODO: process failures by iterating through each bulk response item?
        }
    }

}
