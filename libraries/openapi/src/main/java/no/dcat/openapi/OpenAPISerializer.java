package no.dcat.openapi;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;

import java.io.IOException;

public class OpenAPISerializer extends StdSerializer<OpenAPI> {
    public OpenAPISerializer() {
        this(null);
    }

    public OpenAPISerializer(Class<OpenAPI> vc) {
        super(vc);
    }

    @Override
    public void serialize(OpenAPI value, JsonGenerator gen, SerializerProvider provider) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        String json = mapper.writeValueAsString(value);
//            .writeValueAsString(writer);
//        System.out.println(jsonWriter);
        //        value.toString()
        gen.writeRaw(json);
//        gen.writeStartObject();
//        gen.writeRaw("id", value.getId());
//        gen.writeStringField("name", value.getName());
//        gen.writeEndObject();
    }
}
