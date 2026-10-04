package com.specpulse.gallery.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gallery")
public class GalleryProperties {
  private String publicUrl = "http://127.0.0.1:18766";
  private String frontendUrl = "http://127.0.0.1:43721";
  private String jwtSecret = "";
  private String adminEmails = "";
  private Google google = new Google();

  public String getPublicUrl() {
    return publicUrl;
  }

  public void setPublicUrl(String publicUrl) {
    this.publicUrl = publicUrl;
  }

  public String getFrontendUrl() {
    return frontendUrl;
  }

  public void setFrontendUrl(String frontendUrl) {
    this.frontendUrl = frontendUrl;
  }

  public String getJwtSecret() {
    return jwtSecret;
  }

  public void setJwtSecret(String jwtSecret) {
    this.jwtSecret = jwtSecret;
  }

  public String getAdminEmails() {
    return adminEmails;
  }

  public void setAdminEmails(String adminEmails) {
    this.adminEmails = adminEmails;
  }

  public Google getGoogle() {
    return google;
  }

  public void setGoogle(Google google) {
    this.google = google == null ? new Google() : google;
  }

  public boolean googleEnabled() {
    return google != null && notBlank(google.getClientId()) && notBlank(google.getClientSecret());
  }

  private static boolean notBlank(String value) {
    return value != null && !value.isBlank();
  }

  public static class Google {
    private String clientId = "";
    private String clientSecret = "";

    public String getClientId() {
      return clientId;
    }

    public void setClientId(String clientId) {
      this.clientId = clientId;
    }

    public String getClientSecret() {
      return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
      this.clientSecret = clientSecret;
    }
  }
}
