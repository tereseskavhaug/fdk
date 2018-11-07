package no.dcat.openapi;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

@JsonDeserialize(using = OpenAPIDeserializer.class)
@JsonSerialize(using = OpenAPISerializer.class)
//@JsonInclude(JsonInclude.Include.NON_NULL)
public class OpenAPI extends io.swagger.v3.oas.models.OpenAPI {
}
