package com.specpulse.gallery;

import com.specpulse.gallery.config.GalleryProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SpringBootApplication
@EnableConfigurationProperties(GalleryProperties.class)
public class GalleryApplication {
  private static final Logger log = LoggerFactory.getLogger(GalleryApplication.class);

  public static void main(String[] args) {
    var context = SpringApplication.run(GalleryApplication.class, args);
    GalleryProperties properties = context.getBean(GalleryProperties.class);
    if (properties.googleEnabled()) {
      log.info("구글 로그인이 연결되어 있습니다.");
    } else {
      log.info("구글 로그인이 꺼져 있습니다. gallery-service/google-oauth.json 을 확인하세요.");
    }
  }
}
