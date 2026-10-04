package com.specpulse.gallery.api;

import com.specpulse.gallery.domain.AppUser;
import java.time.Instant;

public record MemberView(long id, String email, String name, String picture, String role, Instant createdAt) {
  public static MemberView from(AppUser user) {
    return new MemberView(
        user.getId(), user.getEmail(), user.getName(), user.getPicture(), user.getRole().name(), user.getCreatedAt());
  }
}
