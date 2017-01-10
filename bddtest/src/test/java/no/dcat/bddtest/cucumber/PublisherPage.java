package no.dcat.bddtest.cucumber;

import cucumber.api.DataTable;
import cucumber.api.java.en.Given;
import cucumber.api.java.en.Then;
import io.github.bonigarcia.wdm.PhantomJsDriverManager;
import no.dcat.bddtest.elasticsearch.client.DeleteIndex;
import no.dcat.harvester.crawler.Loader;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.phantomjs.PhantomJSDriver;

import java.io.File;
import java.util.List;

import static com.thoughtworks.selenium.SeleneseTestBase.assertTrue;

/**
 * Cucumber glue class for the publisher feature.
 */

public class PublisherPage extends SpringIntegrationTestConfig {
    public static final String LOCAL_PATH_TO_IE_DRIVER = "src/main/resources/IEDriverServer.exe";
    private final String index = "dcat";
    private final String filename = "dataset-w-distribution.ttl";
    WebDriver driver = null;

    //Erstatt med properties
    private final String elasticsearchHostname = "localhost";
    private final int elasticsearchPort = 9300;
    private final String portalHostname = "localhost"; // getEnv("fdk.hostname");
    private int portalPort = 8080; //getEnvInt("fdk.port");

    private final String page = "publisher";

    @Given("^I clean elastic search\\.$")
    public void cleanElasticSearch() throws Throwable {


        //String hostname = getEnv("elasticsearch.hostname");
        //int port = getEnvInt("elasticsearch.port");

       new DeleteIndex(elasticsearchHostname, elasticsearchPort).deleteIndex(index);
    }

    @Given("^I load the dataset\\.$")
    public void iLoadDataset() throws Throwable {


        String defultPath = new File(".").getCanonicalPath().toString();
        String fileWithPath = String.format("file:%s/bddtest/src/test/resources/%s", defultPath, filename);

        new Loader(elasticsearchHostname, elasticsearchPort).loadDatasetFromFile(fileWithPath);
    }

    @Given("^I open the Publisher page in the browser\\.$")
    public void i_open_the_Publisher_page_in_the_browser() throws Throwable {

        PhantomJsDriverManager.getInstance().setup();
        driver = new PhantomJSDriver();

        /*
        File file = new File(LOCAL_PATH_TO_IE_DRIVER);
        File fileC = new File("src/main/resources/chromedriver.exe");
        File fileF = new File("src/main/resources/phantomjs.exe");

        System.setProperty("webdriver.ie.driver", file.getAbsolutePath());
        System.setProperty("webdriver.chrome.driver", fileC.getAbsolutePath());
        System.setProperty("phantomjs.binary.path", fileF.getAbsolutePath());

        DesiredCapabilities caps = DesiredCapabilities.internetExplorer();
        DesiredCapabilities capsC = DesiredCapabilities.chrome();

        caps.setCapability("ignoreZoomSetting", true);
        */
        //driver = new InternetExplorerDriver(caps);
        //driver = new ChromeDriver(capsC);
        //driver = new PhantomJSDriver();

        driver.navigate().to(String.format("http://%s:%d/%s", portalHostname, portalPort, page));
    }

    @Then("^the following Publisher and dataset aggregation shall exist:$")
    public void shallHave(DataTable publisherAggrs) throws Throwable {
        WebElement element = null;
        try {
            List<List<String>> publisherAggrsRaw = publisherAggrs.raw();

            for (List<String> publisherAggr : publisherAggrsRaw) {
                String publisherExp = publisherAggr.get(0);
                String countExp = publisherAggr.get(1);

                assertTrue(String.format("The page shall have an element with id %s", publisherExp), driver.findElement(By.id(publisherExp)).isEnabled());

                WebElement publisherElement = driver.findElement(By.id(publisherExp));

                WebElement publisherName = publisherElement.findElement(By.name("publisher"));
                String publisherNameStr = publisherName.getAttribute("innerHTML");

                assertTrue(String.format("The page shall have an element with text %s", publisherExp), publisherExp.equals(publisherNameStr));

                WebElement publisherCount = publisherElement.findElement(By.className("badge"));
                String count = publisherCount.getAttribute("innerHTML");

                assertTrue(String.format("The element %s shall have %s datasets, had %s.", publisherExp, count, count), countExp.equals(count));
            }
        } finally {
            driver.close();
        }
    }

    /*
    protected String getEnv(String env) {
        String value = System.getenv(env);

        if (StringUtils.isEmpty(value)) {
            throw new RuntimeException(String.format("Environment %s variable is not defines.", env));
        }

        return value;
    }

    protected int getEnvInt(String env) {
        return Integer.valueOf(getEnv(env));
    }
    */
}
