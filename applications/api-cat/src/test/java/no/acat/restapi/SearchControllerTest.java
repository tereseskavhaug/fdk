package no.acat.restapi;

import com.fasterxml.jackson.databind.ObjectMapper;
import no.acat.model.ApiDocument;
import no.acat.model.queryresponse.AggregationBucket;
import no.acat.model.queryresponse.QueryResponse;
import no.acat.service.ElasticsearchService;
import no.acat.utils.Utils;
import no.dcat.shared.testcategories.UnitTest;
import org.elasticsearch.action.search.SearchAction;
import org.elasticsearch.action.search.SearchRequestBuilder;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.Client;
import org.elasticsearch.client.ElasticsearchClient;
import org.elasticsearch.index.query.QueryBuilder;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.SearchHits;
import org.elasticsearch.search.aggregations.Aggregation;
import org.elasticsearch.search.aggregations.AggregationBuilder;
import org.elasticsearch.search.aggregations.Aggregations;
import org.elasticsearch.search.aggregations.bucket.terms.Terms;
import org.hamcrest.Matchers;
import org.junit.Assert;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.junit.runner.RunWith;
import org.springframework.test.context.junit4.SpringRunner;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.Assert.assertThat;
import static org.mockito.Mockito.*;

@Category(UnitTest.class)
@RunWith(SpringRunner.class)
public class SearchControllerTest {

  private String apiSpecExample =
      "{\"openapi\": \"3.0.1\",\n"
          + "            \"info\": {\n"
          + "                \"description\": \"Tilbyr et utvalg av opplysninger om alle registrerte enheter i Enhetsregisteret\",\n"
          + "                \"version\": \"0.1\",\n"
          + "                \"title\": \"Åpne data - Enhetsregisteret\",\n"
          + "                \"termsOfService\": \"https://fellesdatakatalog.brreg.no/about\",\n"
          + "                \"contact\": {\n"
          + "                    \"name\": \"Brønnøysundregistrene\",\n"
          + "                    \"url\": \"http://www.brreg.no\",\n"
          + "                    \"email\": \"opendata@brreg.no\"\n"
          + "                },\n"
          + "                \"license\": {\n"
          + "                    \"name\": \"Norsk lisens for offentlige data (NLOD) 2.0\",\n"
          + "                    \"url\": \"http://data.norge.no/nlod/no/2.0\"\n"
          + "                }\n"
          + "            },\n"
          + "            \"servers\": [\n"
          + "                {\n"
          + "                    \"url\": \"https://data.brreg.no/enhetsregisteret/api\",\n"
          + "                    \"description\": \"Produksjonsserver\"\n"
          + "                }\n"
          + "            ],\n"
          + "            \"paths\": {\n"
          + "                \"pathItems\": {\n"
          + "                    \"/organisasjonsformer/underenheter\": {\n"
          + "                        \"get\": {\n"
          + "                            \"description\": \"Hent alle organisasjonsformer for underenheter\",\n"
          + "                            \"responses\": {\n"
          + "                                \"200\": {\n"
          + "                                    \"description\": \"En liste med organisasjonsformer\"\n"
          + "                                }\n"
          + "                            }\n"
          + "                        }\n"
          + "                    },\n"
          + "                    \"/organisasjonsformer/enheter\": {\n"
          + "                        \"get\": {\n"
          + "                            \"description\": \"Hent alle organisasjonsformer for enheter\",\n"
          + "                            \"responses\": {\n"
          + "                                \"200\": {\n"
          + "                                    \"description\": \"En liste med organisasjonsformer\"\n"
          + "                                }\n"
          + "                            }\n"
          + "                        }\n"
          + "                    },\n"
          + "                    \"/underenheter/{orgnr}\": {\n"
          + "                        \"get\": {\n"
          + "                            \"description\": \"Hent en spesifikk underenhet\",\n"
          + "                            \"responses\": {\n"
          + "                                \"200\": {\n"
          + "                                    \"description\": \"En underenhete\"\n"
          + "                                }\n"
          + "                            }\n"
          + "                        }\n"
          + "                    },\n"
          + "                    \"/enheter\": {\n"
          + "                        \"get\": {\n"
          + "                            \"description\": \"Søk etter enheter\",\n"
          + "                            \"responses\": {\n"
          + "                                \"200\": {\n"
          + "                                    \"description\": \"En liste med enheter\"\n"
          + "                                }\n"
          + "                            }\n"
          + "                        }\n"
          + "                    },\n"
          + "                    \"/enheter/lastned\": {\n"
          + "                        \"get\": {\n"
          + "                            \"description\": \"Last ned enheter\",\n"
          + "                            \"responses\": {\n"
          + "                                \"200\": {\n"
          + "                                    \"description\": \"Zip-fil lastes ned\"\n"
          + "                                }\n"
          + "                            }\n"
          + "                        }\n"
          + "                    },\n"
          + "                    \"/underenheter/lastned\": {\n"
          + "                        \"get\": {\n"
          + "                            \"description\": \"Last ned underenheter\",\n"
          + "                            \"responses\": {\n"
          + "                                \"200\": {\n"
          + "                                    \"description\": \"En liste med underenheter\"\n"
          + "                                }\n"
          + "                            }\n"
          + "                        }\n"
          + "                    },\n"
          + "                    \"/organisasjonsformer/{orgkode}\": {\n"
          + "                        \"get\": {\n"
          + "                            \"description\": \"Hent en gitt organisasjonsform\",\n"
          + "                            \"responses\": {\n"
          + "                                \"200\": {\n"
          + "                                    \"description\": \"Beskrivelse av organisasjonsform\"\n"
          + "                                }\n"
          + "                            }\n"
          + "                        }\n"
          + "                    },\n"
          + "                    \"/enheter/{orgnr}\": {\n"
          + "                        \"get\": {\n"
          + "                            \"description\": \"Hent en spesifikk enhet\",\n"
          + "                            \"responses\": {\n"
          + "                                \"200\": {\n"
          + "                                    \"description\": \"En enhet\"\n"
          + "                                }\n"
          + "                            }\n"
          + "                        }\n"
          + "                    },\n"
          + "                    \"/organisasjonsformer\": {\n"
          + "                        \"get\": {\n"
          + "                            \"description\": \"Hent alle organisasjonsformer\",\n"
          + "                            \"responses\": {\n"
          + "                                \"200\": {\n"
          + "                                    \"description\": \"En liste med organisasjonsformer\"\n"
          + "                                }\n"
          + "                            }\n"
          + "                        }\n"
          + "                    },\n"
          + "                    \"/\": {\n"
          + "                        \"get\": {\n"
          + "                            \"description\": \"Rot. lister lenker til øvrige objekter\",\n"
          + "                            \"responses\": {\n"
          + "                                \"200\": {\n"
          + "                                    \"description\": \"En liste med lenker til øvrige tjenester\"\n"
          + "                                }\n"
          + "                            }\n"
          + "                        }\n"
          + "                    },\n"
          + "                    \"/underenheter\": {\n"
          + "                        \"get\": {\n"
          + "                            \"description\": \"Søk etter underenheter\",\n"
          + "                            \"responses\": {\n"
          + "                                \"200\": {\n"
          + "                                    \"description\": \"En liste med underenheter\"\n"
          + "                                }\n"
          + "                            }\n"
          + "                        }\n"
          + "                    }\n"
          + "                },\n"
          + "                \"/organisasjonsformer/underenheter\": {\n"
          + "                    \"get\": {\n"
          + "                        \"description\": \"Hent alle organisasjonsformer for underenheter\",\n"
          + "                        \"responses\": {\n"
          + "                            \"200\": {\n"
          + "                                \"description\": \"En liste med organisasjonsformer\"\n"
          + "                            }\n"
          + "                        }\n"
          + "                    }\n"
          + "                },\n"
          + "                \"/organisasjonsformer/enheter\": {\n"
          + "                    \"get\": {\n"
          + "                        \"description\": \"Hent alle organisasjonsformer for enheter\",\n"
          + "                        \"responses\": {\n"
          + "                            \"200\": {\n"
          + "                                \"description\": \"En liste med organisasjonsformer\"\n"
          + "                            }\n"
          + "                        }\n"
          + "                    }\n"
          + "                },\n"
          + "                \"/underenheter/{orgnr}\": {\n"
          + "                    \"get\": {\n"
          + "                        \"description\": \"Hent en spesifikk underenhet\",\n"
          + "                        \"responses\": {\n"
          + "                            \"200\": {\n"
          + "                                \"description\": \"En underenhete\"\n"
          + "                            }\n"
          + "                        }\n"
          + "                    }\n"
          + "                },\n"
          + "                \"/enheter\": {\n"
          + "                    \"get\": {\n"
          + "                        \"description\": \"Søk etter enheter\",\n"
          + "                        \"responses\": {\n"
          + "                            \"200\": {\n"
          + "                                \"description\": \"En liste med enheter\"\n"
          + "                            }\n"
          + "                        }\n"
          + "                    }\n"
          + "                },\n"
          + "                \"/enheter/lastned\": {\n"
          + "                    \"get\": {\n"
          + "                        \"description\": \"Last ned enheter\",\n"
          + "                        \"responses\": {\n"
          + "                            \"200\": {\n"
          + "                                \"description\": \"Zip-fil lastes ned\"\n"
          + "                            }\n"
          + "                        }\n"
          + "                    }\n"
          + "                },\n"
          + "                \"/underenheter/lastned\": {\n"
          + "                    \"get\": {\n"
          + "                        \"description\": \"Last ned underenheter\",\n"
          + "                        \"responses\": {\n"
          + "                            \"200\": {\n"
          + "                                \"description\": \"En liste med underenheter\"\n"
          + "                            }\n"
          + "                        }\n"
          + "                    }\n"
          + "                },\n"
          + "                \"/organisasjonsformer/{orgkode}\": {\n"
          + "                    \"get\": {\n"
          + "                        \"description\": \"Hent en gitt organisasjonsform\",\n"
          + "                        \"responses\": {\n"
          + "                            \"200\": {\n"
          + "                                \"description\": \"Beskrivelse av organisasjonsform\"\n"
          + "                            }\n"
          + "                        }\n"
          + "                    }\n"
          + "                },\n"
          + "                \"/enheter/{orgnr}\": {\n"
          + "                    \"get\": {\n"
          + "                        \"description\": \"Hent en spesifikk enhet\",\n"
          + "                        \"responses\": {\n"
          + "                            \"200\": {\n"
          + "                                \"description\": \"En enhet\"\n"
          + "                            }\n"
          + "                        }\n"
          + "                    }\n"
          + "                },\n"
          + "                \"/organisasjonsformer\": {\n"
          + "                    \"get\": {\n"
          + "                        \"description\": \"Hent alle organisasjonsformer\",\n"
          + "                        \"responses\": {\n"
          + "                            \"200\": {\n"
          + "                                \"description\": \"En liste med organisasjonsformer\"\n"
          + "                            }\n"
          + "                        }\n"
          + "                    }\n"
          + "                },\n"
          + "                \"/\": {\n"
          + "                    \"get\": {\n"
          + "                        \"description\": \"Rot. lister lenker til øvrige objekter\",\n"
          + "                        \"responses\": {\n"
          + "                            \"200\": {\n"
          + "                                \"description\": \"En liste med lenker til øvrige tjenester\"\n"
          + "                            }\n"
          + "                        }\n"
          + "                    }\n"
          + "                },\n"
          + "                \"/underenheter\": {\n"
          + "                    \"get\": {\n"
          + "                        \"description\": \"Søk etter underenheter\",\n"
          + "                        \"responses\": {\n"
          + "                            \"200\": {\n"
          + "                                \"description\": \"En liste med underenheter\"\n"
          + "                            }\n"
          + "                        }\n"
          + "                    }\n"
          + "                }\n"
          + "            }\n"
          + "        }";

  @Test
  public void checkOne() {
    // todo meaningful test would be to allow elastic client to build a query and process sample
    // response,
    // instead of mocking entire elastic client here
    ElasticsearchService elasticsearchService = mock(ElasticsearchService.class);
    ApiSearchController controller =
        new ApiSearchController(elasticsearchService, Utils.jsonMapper());
    ApiSearchController spyController = spy(controller);

    SearchHit hit = mock(SearchHit.class);
    SearchHit[] hits = {hit};

    SearchHits searchHits = mock(SearchHits.class);
    when(searchHits.getTotalHits()).thenReturn(1L);
    when(searchHits.getHits()).thenReturn(hits);

    SearchResponse searchResponse = mock(SearchResponse.class);
    when(searchResponse.getHits()).thenReturn(searchHits);

    doReturn(null)
        .when(spyController)
        .buildSearchRequest(anyString(), anyString(), anyString(), any(), anyInt(), anyInt());
    doReturn(searchResponse).when(spyController).doQuery(anyObject());
    doNothing().when(spyController).addSortForEmptySearch(anyObject());
    // todo this is nonsense, we do not test anything
    doReturn(new QueryResponse()).when(spyController).convertFromElasticResponse(anyObject());

    when(hit.getSourceAsString()).thenReturn(apiSpecExample);
    when(hit.getId()).thenReturn("http://testtesttset");

    QueryResponse response = spyController.search("", "", "", new String[] {""}, 0, 0, "", "");

    assertThat(response, notNullValue());
  }

  @Test
  public void verify_if_build_search_request_return() {

    ElasticsearchService elasticsearchService = mock(ElasticsearchService.class);
    ElasticsearchClient elasticsearchClient = mock(ElasticsearchClient.class);
    SearchAction action = mock(SearchAction.class);
    AggregationBuilder aggregationBuilder = mock(AggregationBuilder.class);
    Client client = mock(Client.class);
    QueryBuilder queryBuilder = mock(QueryBuilder.class);

    ApiSearchController controller =
        new ApiSearchController(elasticsearchService, Utils.jsonMapper());
    ApiSearchController spyController = spy(controller);

    SearchRequestBuilder searchRequestBuilder =
        new SearchRequestBuilder(elasticsearchClient, action);
    SearchRequestBuilder builder = spy(searchRequestBuilder);

    doCallRealMethod()
        .when(spyController)
        .buildSearchRequest(anyString(), anyString(), anyString(), any(), anyInt(), anyInt());

    when(elasticsearchService.getClient()).thenReturn(client);
    when(client.prepareSearch("acat")).thenReturn(builder);
    when(builder.setTypes(anyString())).thenReturn(builder);
    when(builder.setQuery(queryBuilder)).thenReturn(builder);
    when(builder.setFrom(anyInt())).thenReturn(builder);
    when(builder.setSize(anyInt())).thenReturn(builder);
    when(builder.addAggregation(aggregationBuilder)).thenReturn(builder);

    SearchRequestBuilder expected =
        spyController.buildSearchRequest("query", "", "", new String[] {""}, 0, 0);

    Assert.assertThat(expected, is(notNullValue()));
  }

  @Test
  public void addSortForEmptySearch() {
    ElasticsearchService elasticsearchService = mock(ElasticsearchService.class);
    ApiSearchController controller =
        new ApiSearchController(elasticsearchService, Utils.jsonMapper());
    ApiSearchController spyController = spy(controller);

    ElasticsearchClient elasticsearchClient = mock(ElasticsearchClient.class);
    SearchAction action = mock(SearchAction.class);

    SearchRequestBuilder searchRequestBuilder =
        new SearchRequestBuilder(elasticsearchClient, action);

    SearchRequestBuilder spyBuilder = spy(searchRequestBuilder);

    doCallRealMethod().when(spyController).addSortForEmptySearch(spyBuilder);

    spyController.addSortForEmptySearch(spyBuilder);

    verify(spyController, times(1)).addSortForEmptySearch(spyBuilder);
  }

    @Test
    public void checkConvertHits()  {

        ElasticsearchService elasticsearchService = mock(ElasticsearchService.class);
        ApiSearchController controller = new ApiSearchController(elasticsearchService, Utils.jsonMapper());
        ApiSearchController spyController = spy(controller);
        QueryResponse queryResponse = mock(QueryResponse.class);
        SearchResponse searchResponse = mock(SearchResponse.class);
        SearchHits hits = mock(SearchHits.class);
        SearchHit hit = mock(SearchHit.class);

        SearchHit[] shits = {hit};

        when(searchResponse.getHits()).thenReturn(hits);
        when(searchResponse.getHits().getTotalHits()).thenReturn(1L);
        when(searchResponse.getHits().getHits()).thenReturn(shits);
        when(hit.getSourceAsString()).thenReturn(apiSpecExample);

       spyController.convertHits(queryResponse, searchResponse);

       verify(spyController, times(1)).convertHits(queryResponse, searchResponse);

    }

    @Test
    public void checkConvertAggregations()  {
        ElasticsearchService elasticsearchService = mock(ElasticsearchService.class);
        ApiSearchController controller = new ApiSearchController(elasticsearchService, Utils.jsonMapper());
        ApiSearchController spyController = spy(controller);
        QueryResponse queryResponse = mock(QueryResponse.class);

        List<Aggregation> list = new ArrayList<>();
        Aggregations aggregations = new Aggregations(list);

        SearchResponse searchResponse = mock(SearchResponse.class);

        when(searchResponse.getAggregations()).thenReturn(aggregations);

        //Map<String, Aggregation> mockMap = mock(Map.class);
        //when(aggregations.getAsMap()).thenReturn(mockMap);

        spyController.convertAggregations(queryResponse, searchResponse);

        verify(spyController, times(1)).convertAggregations(queryResponse, searchResponse);

    }

   /* @Test
    public void checkConvertFromElasticResponse()  {
        ElasticsearchService elasticsearchService = mock(ElasticsearchService.class);
        ApiSearchController controller = new ApiSearchController(elasticsearchService, Utils.jsonMapper());
        ApiSearchController spyController = spy(controller);
        ApiSearchController mockController = mock(ApiSearchController.class);
        QueryResponse queryResponse = mock(QueryResponse.class);
        SearchResponse searchResponse = mock(SearchResponse.class);

        doNothing().when(mockController).convertHits(queryResponse, searchResponse);
        doNothing().when(mockController).convertAggregations(queryResponse, searchResponse);

        when(spyController.convertFromElasticResponse(searchResponse)).thenReturn(queryResponse);

    }*/



}
