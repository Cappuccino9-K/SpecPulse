package com.specpulse.gallery.security;

import com.specpulse.gallery.domain.AppUser;
import com.specpulse.gallery.repo.AppUserRepository;
import java.util.List;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.stereotype.Component;

@Component
public class GalleryJwtAuthentication implements Converter<Jwt, AbstractAuthenticationToken> {
  private final AppUserRepository users;

  public GalleryJwtAuthentication(AppUserRepository users) {
    this.users = users;
  }

  @Override
  public AbstractAuthenticationToken convert(Jwt jwt) {
    long id;
    try {
      id = Long.parseLong(jwt.getSubject());
    } catch (NumberFormatException exception) {
      throw new InvalidBearerTokenException("로그인이 만료되었습니다. 다시 로그인해 주세요.");
    }
    AppUser user =
        users
            .findById(id)
            .orElseThrow(() -> new InvalidBearerTokenException("로그인이 만료되었습니다. 다시 로그인해 주세요."));
    var authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
    return new UsernamePasswordAuthenticationToken(user, jwt, List.of(authority));
  }
}
