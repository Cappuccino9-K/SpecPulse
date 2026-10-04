package com.specpulse.gallery.service;

import com.specpulse.gallery.config.GalleryProperties;
import com.specpulse.gallery.domain.AppUser;
import com.specpulse.gallery.domain.GalleryRole;
import com.specpulse.gallery.repo.AppUserRepository;
import java.time.Instant;
import java.util.Arrays;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccountService {
  private final AppUserRepository users;
  private final GalleryProperties properties;

  public AccountService(AppUserRepository users, GalleryProperties properties) {
    this.users = users;
    this.properties = properties;
  }

  @Transactional
  public AppUser upsertFromGoogle(OAuth2User oauthUser) {
    String sub = stringAttr(oauthUser, "sub");
    String email = stringAttr(oauthUser, "email");
    if (sub == null || email == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "구글 계정에서 이메일 정보를 받지 못했습니다.");
    }
    Object verified = oauthUser.getAttribute("email_verified");
    if (Boolean.FALSE.equals(verified) || "false".equalsIgnoreCase(String.valueOf(verified))) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "이메일 인증이 끝난 구글 계정만 로그인할 수 있습니다.");
    }
    String normalized = email.trim().toLowerCase(Locale.ROOT);
    AppUser user =
        users
            .findByGoogleSub(sub)
            .or(() -> users.findByEmailIgnoreCase(normalized))
            .orElseGet(AppUser::new);
    boolean fresh = user.getId() == null;
    user.setGoogleSub(sub);
    user.setEmail(normalized);
    String name = stringAttr(oauthUser, "name");
    user.setName(name == null || name.isBlank() ? normalized : trim(name, 80));
    String picture = stringAttr(oauthUser, "picture");
    user.setPicture(picture == null ? null : trim(picture, 500));
    if (fresh) {
      user.setCreatedAt(Instant.now());
      user.setRole(initialRole(normalized));
    } else if (adminEmail(normalized) && user.getRole() != GalleryRole.ADMIN) {
      user.setRole(GalleryRole.ADMIN);
    }
    return users.save(user);
  }

  @Transactional
  public AppUser changeRole(AppUser actor, long userId, GalleryRole next) {
    if (actor.getRole() != GalleryRole.ADMIN) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "역할 변경은 어드민만 할 수 있습니다.");
    }
    AppUser target =
        users.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "회원을 찾지 못했습니다."));
    if (target.getRole() == GalleryRole.ADMIN && next != GalleryRole.ADMIN && users.countByRole(GalleryRole.ADMIN) <= 1) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "마지막 어드민의 역할은 바꿀 수 없습니다.");
    }
    target.setRole(next);
    return users.save(target);
  }

  private GalleryRole initialRole(String email) {
    if (adminEmail(email) || users.countByRole(GalleryRole.ADMIN) == 0) {
      return GalleryRole.ADMIN;
    }
    return GalleryRole.USER;
  }

  private boolean adminEmail(String email) {
    String configured = properties.getAdminEmails();
    if (configured == null || configured.isBlank()) return false;
    return Arrays.stream(configured.split(","))
        .map(item -> item.trim().toLowerCase(Locale.ROOT))
        .anyMatch(email::equals);
  }

  private static String stringAttr(OAuth2User user, String name) {
    Object value = user.getAttribute(name);
    return value == null ? null : String.valueOf(value);
  }

  private static String trim(String value, int max) {
    String trimmed = value.trim();
    return trimmed.length() <= max ? trimmed : trimmed.substring(0, max);
  }
}
