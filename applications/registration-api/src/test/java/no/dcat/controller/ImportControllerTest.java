package no.dcat.controller;


import no.dcat.model.Dataset;
import no.dcat.model.exceptions.CatalogNotFoundException;
import no.dcat.model.exceptions.DatasetNotFoundException;
import no.dcat.shared.SkosCode;
import no.dcat.datastore.domain.dcat.builders.DcatReader;
import no.dcat.shared.testcategories.UnitTest;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.util.FileManager;
import org.junit.Before;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.mockito.Mockito;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@Category(UnitTest.class)
public class ImportControllerTest {
    static Logger logger = LoggerFactory.getLogger(ImportControllerTest.class);

    ImportController importController;
    Model model;

    @Before
    public void setup() {
        model = FileManager.get().loadModel("export.jsonld");

        ImportController imp = new ImportController(null, null, null);
        importController = Mockito.spy(imp);
    }

    @Test
    public void publisherContainsMultipleNamesWhenOnlyOneIsExpected() throws Throwable {
        model = FileManager.get().loadModel("ut1-export.ttl");

        ImportController impController = new ImportController(null,null,null);
        ImportController iController = Mockito.spy(impController);
        Map<String,String> prefLabel = new HashMap<>();
        prefLabel.put("no", "test");

        doReturn(prefLabel).when(iController).getLabelForCode(anyString(), anyString());
        doReturn(new DcatReader(model)).when(iController).getDcatReader(any());

        List<Dataset> ds = iController.parseDatasets(model);

        assertThat(ds.size(), is(27));
    }

    @Test
    public void parseSetsPublisher() throws Throwable {
        model = FileManager.get().loadModel("ut1-export.ttl");

        ImportController importController = new ImportController(null, null, null);
        ImportController iController = Mockito.spy(importController);
        Map<String,String> prefLabel = new HashMap<>();
        prefLabel.put("no", "test");

        doReturn(prefLabel).when(iController).getLabelForCode(anyString(), anyString());
        doReturn(new DcatReader(model)).when(iController).getDcatReader(any());

        List<Dataset> ds = iController.parseDatasets(model);

        ds.forEach( dataset -> {
            assertThat(String.format("dataset %s has null publisher", dataset.getId()), dataset.getPublisher(), is(not(nullValue())));
        });
    }

    /*
    @Test
    public void importDatasetSetsPublisher() throws Throwable {

        model = FileManager.get().loadModel("ut1-export.ttl");
        String catalogId = "974760673";
        Publisher publisher = new Publisher();
        publisher.setName("BRREG");
        Catalog catalogId = new Catalog();
        catalogId.setId(catalogId);
        catalogId.setPublisher(publisher);

        ImportController importController = new ImportController();
        DatasetController datasetController = new DatasetController(null,null);
        importController.datasetController = datasetController;

        ImportController iController = Mockito.spy(importController);
        Map<String,String> prefLabel = new HashMap<>();
        prefLabel.put("no", "test");

        doNothing().when(iController).fetchCodes();
        doReturn(prefLabel).when(iController).getLabelForCode(anyString(), anyString());


        List<Dataset> datasets = iController.parseAndSaveDatasets(model,  catalogId, catalogId );

        datasets.forEach( dataset -> {
            logger.warn(dataset.getId() + " " + dataset.getPublisher().getName() + " " + dataset.getRegistrationStatus());

        });
    }
*/

    @Test
    public void testLanguagePruning(){

        SkosCode skosCode1 = new SkosCode();

        skosCode1.getPrefLabel().put("en", "english");
        skosCode1.getPrefLabel().put("fi", "finish");


        SkosCode skosCode2 = new SkosCode();

        skosCode2.getPrefLabel().put("en", "english");
        skosCode2.getPrefLabel().put("no", "norwegian");

        List<SkosCode> skosCodes = Arrays.asList(skosCode1, skosCode2, skosCode1, skosCode2);

        new ImportController(null,null,null).pruneLanguages(skosCodes);

        assertNull(skosCode1.getPrefLabel().get("fi"));

        assertNotNull(skosCode1.getPrefLabel().get("en"));
        assertNotNull(skosCode2.getPrefLabel().get("en"));
        assertNotNull(skosCode2.getPrefLabel().get("no"));

    }

    @Test
    public void importDatasets() throws DatasetNotFoundException, CatalogNotFoundException, IOException {

        ImportController importController = new ImportController(null, null, null);
        ImportController spyImportController = Mockito.spy(importController);

    // URL url = new URL("www.barnehagefakta.no:80/swagger/docs/v1");
        /*URL url = new URL("http://www.barnehagefakta.no:80/swagger/docs/v1");
        when(url.getProtocol()).thenReturn("htt");*/
        String catalogId = "974760673";



    }



}
