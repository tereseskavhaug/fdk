package no.acat.service;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.Paths;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import no.acat.model.ApiDocument;
import no.acat.repository.ApiDocumentRepository;
import no.acat.spec.ParseException;
import no.dcat.client.publishercat.PublisherCatClient;
import no.dcat.client.registrationapi.ApiRegistrationPublic;
import no.dcat.htmlclean.HtmlCleaner;
import no.dcat.shared.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

import static com.google.common.base.Strings.isNullOrEmpty;

/*
ApiDocumentBuilder service is enriching api registrations with related data and
denormalizes it for indexing and display purpose in search service
 */
@Service
public class ApiDocumentBuilderService {
    private static final Logger logger = LoggerFactory.getLogger(ApiDocumentBuilderService.class);
    private ApiDocumentRepository apiDocumentRepository;
    private ParserService parserService;
    private PublisherCatClient publisherCatClient;
    private DatasetCatClient datasetCatClient;

    @Autowired
    public ApiDocumentBuilderService(ApiDocumentRepository apiDocumentRepository, ParserService parserService, PublisherCatClient publisherCatClient, DatasetCatClient datasetCatClient) {
        this.apiDocumentRepository = apiDocumentRepository;
        this.parserService = parserService;
        this.publisherCatClient = publisherCatClient;
        this.datasetCatClient = datasetCatClient;
    }

    public ApiDocument createFromApiRegistration(ApiRegistrationPublic apiRegistration, String harvestSourceUri, Date harvestDate) throws IOException, ParseException {
        String apiSpecUrl = apiRegistration.getApiSpecUrl();
        String apiSpec = getApiSpec(apiRegistration);
        OpenAPI openApi = parserService.parse(apiSpec);

        Optional<ApiDocument> existingApiDocumentOptional = apiDocumentRepository.getApiDocumentByHarvestSourceUri(harvestSourceUri);
        String id = existingApiDocumentOptional.isPresent() ? existingApiDocumentOptional.get().getId() : UUID.randomUUID().toString();

        ApiDocument apiDocument = new ApiDocument().builder()
            .id(id)
            .harvestSourceUri(harvestSourceUri)
            .apiSpecUrl(apiSpecUrl)
            .apiSpec(apiSpec)
            .build();

        populateFromApiRegistration(apiDocument, apiRegistration);
        populateFromOpenApi(apiDocument, openApi);
        updateHarvestMetadata(apiDocument, harvestDate, existingApiDocumentOptional.orElse(null));

        logger.info("ApiDocument is created. id={}, harvestSourceUri={}", apiDocument.getId(), apiDocument.getHarvestSourceUri());
        return apiDocument;
    }

    void updateHarvestMetadata(ApiDocument apiDocument, Date harvestDate, ApiDocument existingApiDocument) {
        HarvestMetadata oldHarvest = existingApiDocument != null ? existingApiDocument.getHarvest() : null;

        // new document is not considered a change
        boolean hasChanged = existingApiDocument != null && !isEqualContent(apiDocument, existingApiDocument);

        HarvestMetadata harvest = HarvestMetadataUtil.createOrUpdate(oldHarvest, harvestDate, hasChanged);

        apiDocument.setHarvest(harvest);
    }

    String getApiSpec(ApiRegistrationPublic apiRegistration) throws IOException {
        String apiSpecUrl = apiRegistration.getApiSpecUrl();
        String apiSpec = apiRegistration.getApiSpec();

        if (isNullOrEmpty(apiSpec) && !isNullOrEmpty(apiSpecUrl)) {
            apiSpec = parserService.getSpecFromUrl(apiSpecUrl);
        }
        return apiSpec;
    }

    boolean isEqualContent(ApiDocument first, ApiDocument second) {
        String[] ignoredProperties = {"id", "harvest", "openApi"};
        ApiDocument firstContent = new ApiDocument();
        ApiDocument secondContent = new ApiDocument();

        BeanUtils.copyProperties(first, firstContent, ignoredProperties);
        BeanUtils.copyProperties(second, secondContent, ignoredProperties);

        // This is a poor mans comparator. Seems to include all fields
        String firstString = firstContent.toString();
        String secondString = secondContent.toString();
        return firstString.equals(secondString);
    }

    void populateFromApiRegistration(ApiDocument apiDocument, ApiRegistrationPublic apiRegistration) {
        apiDocument.setPublisher(lookupPublisher(apiRegistration.getCatalogId()));
        apiDocument.setNationalComponent(apiRegistration.isNationalComponent());
        apiDocument.setDatasetReferences(extractDatasetReferences(apiRegistration));
        apiDocument.setApiDocUrl(apiRegistration.getApiDocUrl());
        apiDocument.setCost(apiRegistration.getCost());
        apiDocument.setUsageLimitation(apiRegistration.getUsageLimitation());
        apiDocument.setPerformance(apiRegistration.getPerformance());
        apiDocument.setAvailability(apiRegistration.getAvailability());
    }

    Publisher lookupPublisher(String orgNr) {
        try {
            return publisherCatClient.getByOrgNr(orgNr);
        } catch (Exception e) {
            logger.warn("Publisher lookup failed for orgNr={}. Error: {}", orgNr, e.getMessage());
        }
        return null;
    }

    Set<DatasetReference> extractDatasetReferences(ApiRegistrationPublic apiRegistration) {
        List<String> datasetReferenceSources = apiRegistration.getDatasetReferences();

        if (datasetReferenceSources == null) {
            return null;
        }

        Set<DatasetReference> datasetReferences = datasetReferenceSources.stream()
            .filter(it -> !it.isEmpty())
            .map(datasetRefUrl -> datasetCatClient.lookupDatasetReferenceByUri(datasetRefUrl))
            .filter(Optional::isPresent)
            .map(Optional::get)
            .collect(Collectors.toSet());

        return datasetReferences.isEmpty() ? null : datasetReferences;
    }

    void populateFromOpenApi(ApiDocument apiDocument, OpenAPI openApi) {

        if (openApi == null) {
            return;
        }

        apiDocument.setOpenApi(openApi);

        if (openApi.getInfo() != null) {
            if (openApi.getInfo().getTitle() != null) {
                apiDocument.setTitle(HtmlCleaner.cleanAllHtmlTags(openApi.getInfo().getTitle()));
                apiDocument.setTitleFormatted(HtmlCleaner.clean(openApi.getInfo().getTitle()));
            }

            if (openApi.getInfo().getDescription() != null) {
                apiDocument.setDescription(HtmlCleaner.cleanAllHtmlTags(openApi.getInfo().getDescription()));
                apiDocument.setDescriptionFormatted(HtmlCleaner.clean(openApi.getInfo().getDescription()));
            }

            if (openApi.getInfo().getContact() != null) {
                apiDocument.setContactPoint(new ArrayList<>());
                Contact contact = new Contact();
                if (openApi.getInfo().getContact().getEmail() != null) {
                    contact.setEmail(HtmlCleaner.cleanAllHtmlTags(openApi.getInfo().getContact().getEmail()));
                }
                if (openApi.getInfo().getContact().getName() != null) {
                    contact.setOrganizationName(HtmlCleaner.cleanAllHtmlTags(openApi.getInfo().getContact().getName()));
                }
                if (openApi.getInfo().getContact().getUrl() != null) {
                    contact.setUri(HtmlCleaner.cleanAllHtmlTags(openApi.getInfo().getContact().getUrl()));
                }
                apiDocument.getContactPoint().add(contact);
            }
        }

        if (isNullOrEmpty(apiDocument.getApiDocUrl())) {
            ExternalDocumentation externalDocs = openApi.getExternalDocs();
            if (externalDocs != null) {
                String docUrl = externalDocs.getUrl();
                if (!isNullOrEmpty(docUrl)) {
                    apiDocument.setApiDocUrl(docUrl);
                }
            }
        }

        apiDocument.setFormats(getFormatsFromOpenApi(openApi));
    }

    Set<String> getFormatsFromOpenApi(OpenAPI openAPI) {
        Set<String> formats = new HashSet<>();
        Paths paths = openAPI.getPaths();
        paths.forEach((path, pathItem) -> {
            List<Operation> operations = pathItem.readOperations();
            operations.forEach((operation -> {
                if (operation == null) return;

                /*as of now, request body formats are not included
                RequestBody requestBody = operation.getRequestBody();
                if (requestBody == null) return;
                Content requestBodyContent = requestBody.getContent();
                if (requestBodyContent==null) return;
                formats.addAll(requestBodyContent.keySet());
                */
                ApiResponses apiResponses = operation.getResponses();
                if (apiResponses == null) return;
                List<ApiResponse> apiResponseList = new ArrayList<>(apiResponses.values());
                apiResponseList.forEach(apiResponse -> {
                    Content responseContent = apiResponse.getContent();
                    if (responseContent == null) return;
                    formats.addAll(responseContent.keySet());
                });
            }));
        });
        return formats;
    }

}
