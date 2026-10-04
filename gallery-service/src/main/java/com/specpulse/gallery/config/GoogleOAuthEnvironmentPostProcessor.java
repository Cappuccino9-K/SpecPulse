package com.specpulse.gallery.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.util.StringUtils;

public class GoogleOAuthEnvironmentPostProcessor implements EnvironmentPostProcessor {
  @Override
  public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
    if (StringUtils.hasText(environment.getProperty("gallery.google.client-id"))
        && StringUtils.hasText(environment.getProperty("gallery.google.client-secret"))) {
      return;
    }
    Path file = Path.of("google-oauth.json");
    if (!Files.isRegularFile(file)) return;
    try {
      JsonNode root = new ObjectMapper().readTree(file.toFile());
      JsonNode client = root.hasNonNull("web") ? root.get("web") : root.get("installed");
      if (client == null) return;
      String clientId = text(client, "client_id");
      String clientSecret = text(client, "client_secret");
      if (!StringUtils.hasText(clientId) || !StringUtils.hasText(clientSecret)) return;
      Map<String, Object> values = new HashMap<>();
      values.put("gallery.google.client-id", clientId);
      values.put("gallery.google.client-secret", clientSecret);
      environment.getPropertySources().addFirst(new MapPropertySource("google-oauth-json", values));
    } catch (IOException ignored) {
      // 잘못된 JSON이면 구글 로그인 없이 갤러리만 띄웁니다.
    }
  }

  private static String text(JsonNode node, String field) {
    JsonNode value = node.get(field);
    return value == null || value.isNull() ? "" : value.asText("");
  }
}
