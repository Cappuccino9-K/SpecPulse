package com.specpulse.gallery.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.specpulse.gallery.config.GalleryProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class AccountControllerTest {
  @Test
  void authConfigIsEnabledWhenGoogleClientExists() throws Exception {
    GalleryProperties properties = new GalleryProperties();
    GalleryProperties.Google google = new GalleryProperties.Google();
    google.setClientId("client.apps.googleusercontent.com");
    google.setClientSecret("secret");
    properties.setGoogle(google);

    MockMvc mvc = MockMvcBuilders.standaloneSetup(new AccountController(properties, null, null, null, null)).build();
    mvc.perform(get("/api/auth/config").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.googleEnabled").value(true))
        .andExpect(jsonPath("$.loginUrl").value("http://127.0.0.1:18766/oauth2/authorization/google"));
  }
}
