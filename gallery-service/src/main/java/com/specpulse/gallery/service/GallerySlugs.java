package com.specpulse.gallery.service;

import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class GallerySlugs {
  private static final Pattern PATTERN = Pattern.compile("^[a-z0-9]+(?:-[a-z0-9]+)*$");
  private static final Set<String> RESERVED = Set.of("new", "request", "requests", "members", "write", "auth", "api");

  private GallerySlugs() {}

  public static String require(String raw) {
    if (raw == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "갤러리 주소는 영어 소문자와 숫자, 하이픈만 사용할 수 있습니다.");
    }
    String slug = raw.trim().toLowerCase();
    if (slug.length() < 2 || slug.length() > 40 || !PATTERN.matcher(slug).matches() || RESERVED.contains(slug)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "갤러리 주소는 영어 소문자와 숫자, 하이픈만 사용할 수 있습니다.");
    }
    return slug;
  }
}
