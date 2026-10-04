package com.specpulse.gallery;

import com.specpulse.gallery.config.GalleryProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(GalleryProperties.class)
public class GalleryApplication {
  public static void main(String[] args) {
    SpringApplication.run(GalleryApplication.class, args);
  }
}
