package com.specpulse.gallery.security;

import com.specpulse.gallery.config.GalleryProperties;
import com.specpulse.gallery.domain.AppUser;
import com.specpulse.gallery.service.AccountService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class GoogleLoginHandler implements AuthenticationSuccessHandler, AuthenticationFailureHandler {
  private final AccountService accounts;
  private final GalleryTokens tokens;
  private final GalleryProperties properties;

  public GoogleLoginHandler(AccountService accounts, GalleryTokens tokens, GalleryProperties properties) {
    this.accounts = accounts;
    this.tokens = tokens;
    this.properties = properties;
  }

  @Override
  public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication)
      throws IOException {
    try {
      AppUser user = accounts.upsertFromGoogle((OAuth2User) authentication.getPrincipal());
      String raw = tokens.issue(user);
      GallerySessionCookie.write(response, raw);
      String token = URLEncoder.encode(raw, StandardCharsets.UTF_8);
      response.setHeader("Cache-Control", "no-store");
      response.sendRedirect(frontend("/auth/callback?token=" + token));
    } catch (ResponseStatusException exception) {
      String message = exception.getReason() == null ? "구글 로그인을 끝내지 못했습니다." : exception.getReason();
      response.sendRedirect(frontend("/login?error=" + URLEncoder.encode(message, StandardCharsets.UTF_8)));
    }
  }

  @Override
  public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
      throws IOException {
    response.sendRedirect(frontend("/login?error=" + URLEncoder.encode("구글 로그인을 끝내지 못했습니다.", StandardCharsets.UTF_8)));
  }

  private String frontend(String path) {
    String base = properties.getFrontendUrl() == null ? "http://127.0.0.1:43721" : properties.getFrontendUrl().replaceAll("/$", "");
    return base + path;
  }
}
