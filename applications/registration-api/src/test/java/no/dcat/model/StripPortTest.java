package no.dcat.model;

import org.hamcrest.core.Is;
import org.junit.Assert;
import org.junit.Test;

public class StripPortTest {

    @Test
    public void stripPort() {

        String request = "https://reg-gui-fellesdatakatalog-st1.paas-nprd.brreg.no:8080/logout";

        String strip = request.replaceAll(":8080/logout", "");

        Assert.assertThat(strip, Is.is("https://reg-gui-fellesdatakatalog-st1.pas-nprd.brreg.no"));


    }
}
