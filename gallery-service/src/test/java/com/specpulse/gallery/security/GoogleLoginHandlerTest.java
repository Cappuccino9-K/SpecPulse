package com.specpulse.gallery.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.specpulse.gallery.config.GalleryProperties;
import com.specpulse.gallery.domain.AppUser;
import com.specpulse.gallery.domain.GalleryRole;
import com.specpulse.gallery.service.AccountService;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;

class GoogleLoginHandlerTest {
  @Test
  void redirectCarriesTheTokenInTheQuery() throws Exception {
    var key = GalleryTokens.key("specpulse-gallery-test-secret-key");
    AccountService accounts = mock(AccountService.class);
    AppUser user = new AppUser();
    setId(user, 4L);
    user.setEmail("admin@example.com");
    user.setName("관리자");
    user.setRole(GalleryRole.ADMIN);
    user.setGoogleSub("sub");
    user.setCreatedAt(Instant.parse("2026-10-04T00:00:00Z"));
    when(accounts.upsertFromGoogle(any())).thenReturn(user);

    GoogleLoginHandler handler = new GoogleLoginHandler(accounts, new GalleryTokens(key), new GalleryProperties());
    Authentication authentication = mock(Authentication.class);
    when(authentication.getPrincipal()).thenReturn(mock(OAuth2User.class));
    MockHttpServletResponse response = new MockHttpServletResponse();

    handler.onAuthenticationSuccess(new MockHttpServletRequest(), response, authentication);

    String location = response.getRedirectedUrl();
    assertTrue(location.startsWith("http://127.0.0.1:43721/auth/callback?token="));
    assertFalse(location.contains("#"));
    String token = URLDecoder.decode(location.substring(location.indexOf("token=") + 6), StandardCharsets.UTF_8);
    assertEquals("4", GalleryTokens.decoder(key).decode(token).getSubject());
    assertEquals("ADMIN", GalleryTokens.decoder(key).decode(token).getClaim("role"));
  }

  private static void setId(AppUser user, long id) throws ReflectiveOperationException {
    var field = AppUser.class.getDeclaredField("id");
    field.setAccessible(true);
    field.set(user, id);
  }
}
