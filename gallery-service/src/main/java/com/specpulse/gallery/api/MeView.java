package com.specpulse.gallery.api;

import com.specpulse.gallery.domain.AppUser;

public record MeView(long id, String email, String name, String picture, String role) {
  public static MeView from(AppUser user) {
    return new MeView(user.getId(), user.getEmail(), user.getName(), user.getPicture(), user.getRole().name());
  }
}
