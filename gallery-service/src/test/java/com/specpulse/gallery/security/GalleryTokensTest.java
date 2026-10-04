package com.specpulse.gallery.security;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.specpulse.gallery.domain.AppUser;
import com.specpulse.gallery.domain.GalleryRole;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class GalleryTokensTest {
  @Test
  void roundTripsRole() {
    var key = GalleryTokens.key("specpulse-gallery-test-secret-key");
    var tokens = new GalleryTokens(key);
    AppUser user = new AppUser();
    setId(user, 7L);
    user.setEmail("person@example.com");
    user.setName("사람");
    user.setRole(GalleryRole.MODERATOR);
    user.setGoogleSub("sub");
    user.setCreatedAt(Instant.now());

    var jwt = GalleryTokens.decoder(key).decode(tokens.issue(user));

    assertEquals("7", jwt.getSubject());
    assertEquals("MODERATOR", jwt.getClaim("role"));
    assertEquals("person@example.com", jwt.getClaim("email"));
  }

  private static void setId(AppUser user, long id) {
    try {
      var field = AppUser.class.getDeclaredField("id");
      field.setAccessible(true);
      field.set(user, id);
    } catch (ReflectiveOperationException exception) {
      throw new IllegalStateException(exception);
    }
  }
}
