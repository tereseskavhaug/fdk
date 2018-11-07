package no.acat.restapi;

import no.acat.model.queryresponse.QueryResponse;
import no.acat.service.ElasticsearchService;
import no.acat.utils.Utils;
import no.dcat.shared.testcategories.UnitTest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.SearchHits;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.junit.runner.RunWith;
import org.springframework.test.context.junit4.SpringRunner;

import static org.hamcrest.Matchers.notNullValue;
import static org.junit.Assert.assertThat;
import static org.mockito.Mockito.*;

@Category(UnitTest.class)
@RunWith(SpringRunner.class)
public class ConvertControllerTest {

    @Test
    public void checkOne() {
        // todo meaningful test would be to allow elastic client to build a query and process sample response,
        // instead of mocking entire elastic client here
        ElasticsearchService elasticsearchService = mock(ElasticsearchService.class);
        ApiSearchController controller = new ApiSearchController(elasticsearchService, Utils.jsonMapper());
        ApiSearchController spyController = spy(controller);

        SearchHit hit = mock(SearchHit.class);
        SearchHit[] hits = {hit};

        SearchHits searchHits = mock(SearchHits.class);
        when(searchHits.getTotalHits()).thenReturn(1L);
        when(searchHits.getHits()).thenReturn(hits);

        SearchResponse searchResponse = mock(SearchResponse.class);
        when(searchResponse.getHits()).thenReturn(searchHits);

        doReturn(null).when(spyController).buildSearchRequest(anyString(), anyString(), anyString(), any(), anyInt(), anyInt());
        doReturn(searchResponse).when(spyController).doQuery(anyObject());
        doNothing().when(spyController).addSortForEmptySearch(anyObject());
        // todo this is nonsense, we do not test anything
        doReturn(new QueryResponse()).when(spyController).convertFromElasticResponse(anyObject());

        when(hit.getSourceAsString()).thenReturn(apiSpecExample);
        when(hit.getId()).thenReturn("http://testtesttset");

        QueryResponse response = spyController.search("", "", "", new String[]{""}, 0, 0, "", "");

        assertThat(response, notNullValue());

    }

}
