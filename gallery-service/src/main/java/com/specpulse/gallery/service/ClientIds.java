package com.specpulse.gallery.service;

import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class ClientIds {
  private static final Pattern PATTERN = Pattern.compile("^[A-Za-z0-9-]{8,64}$");

  private ClientIds() {}

  public static String require(String raw) {
    if (raw == null || !PATTERN.matcher(raw.trim()).matches()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "브라우저 식별자가 올바르지 않습니다.");
    }
    return raw.trim();
  }
}
