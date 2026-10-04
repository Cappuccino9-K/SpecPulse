package com.specpulse.gallery.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

public final class GallerySessionCookie {
  public static final String NAME = "specpulse_session";

  private GallerySessionCookie() {}

  public static void write(HttpServletResponse response, String token) {
    response.addHeader(HttpHeaders.SET_COOKIE, cookie(token, GalleryTokens.LOGIN_TTL).toString());
  }

  public static void clear(HttpServletResponse response) {
    response.addHeader(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO).toString());
  }

  public static String read(HttpServletRequest request) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) return null;
    for (Cookie cookie : cookies) {
      if (!NAME.equals(cookie.getName())) continue;
      String value = cookie.getValue();
      if (value == null || value.isBlank()) return null;
      return value;
    }
    return null;
  }

  private static ResponseCookie cookie(String token, Duration maxAge) {
    return ResponseCookie.from(NAME, token)
        .httpOnly(true)
        .path("/")
        .maxAge(maxAge)
        .sameSite("Lax")
        .secure(false)
        .build();
  }
}
