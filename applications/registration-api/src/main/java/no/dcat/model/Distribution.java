package no.dcat.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.ToString;

import java.util.List;
import java.util.Map;

/**
 * Created by bjg on 24.02.2017.
 */
@Data
@ToString(includeFieldNames = false)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Distribution {
    private String id;
    private String uri;
    private Map<String,String> title;
    private Map<String,String> description;
    private List<String> downloadURL;
    private List<String> accessURL;
    private String license;
    private List<String> format;
}