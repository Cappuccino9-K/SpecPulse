package com.specpulse.gallery.config;

import com.specpulse.gallery.security.GalleryJwtAuthentication;
import com.specpulse.gallery.security.GallerySessionCookie;
import com.specpulse.gallery.security.GalleryTokens;
import com.specpulse.gallery.security.GoogleLoginHandler;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import javax.crypto.SecretKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import com.specpulse.gallery.security.GalleryAuthEntryPoint;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {
  private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

  @Bean
  SecretKey galleryJwtKey(GalleryProperties properties) {
    String raw = properties.getJwtSecret();
    if (raw == null || raw.isBlank()) {
      raw = storedJwtSecret();
    }
    return GalleryTokens.key(raw);
  }

  private static String storedJwtSecret() {
    Path file = Path.of(".jwt-secret");
    try {
      if (Files.isRegularFile(file)) {
        String saved = Files.readString(file).trim();
        if (!saved.isBlank()) return saved;
      }
      byte[] bytes = new byte[32];
      new SecureRandom().nextBytes(bytes);
      String created = Base64.getEncoder().encodeToString(bytes);
      Files.writeString(file, created);
      log.info("로그인 키를 gallery-service/.jwt-secret 에 저장했습니다. 서버를 다시 켜도 로그인이 유지됩니다.");
      return created;
    } catch (IOException exception) {
      byte[] bytes = new byte[32];
      new SecureRandom().nextBytes(bytes);
      log.warn("로그인 키 파일을 만들지 못했습니다. 서버를 다시 시작하면 로그인도 다시 해야 합니다.");
      return Base64.getEncoder().encodeToString(bytes);
    }
  }

  @Bean
  BearerTokenResolver galleryBearerTokenResolver() {
    DefaultBearerTokenResolver delegate = new DefaultBearerTokenResolver();
    return request -> {
      String path = request.getRequestURI();
      String method = request.getMethod();
      boolean accountRequest =
          ("POST".equals(method) && "/api/galleries".equals(path))
              || path.startsWith("/api/gallery-requests")
              || path.startsWith("/api/members")
              || "/api/me".equals(path);
      if (!accountRequest) return null;
      String session = GallerySessionCookie.read(request);
      if (session != null) return session;
      return delegate.resolve(request);
    };
  }

  @Bean
  JwtDecoder galleryJwtDecoder(SecretKey galleryJwtKey) {
    return GalleryTokens.decoder(galleryJwtKey);
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://127.0.0.1:43721", "http://localhost:43721"));
    config.setAllowedMethods(List.of("GET", "POST", "PATCH", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }

  @Bean
  SecurityFilterChain securityFilterChain(
      HttpSecurity http,
      ObjectProvider<ClientRegistrationRepository> clients,
      GalleryJwtAuthentication jwtAuthentication,
      JwtDecoder galleryJwtDecoder,
      BearerTokenResolver galleryBearerTokenResolver,
      GoogleLoginHandler googleLogin)
      throws Exception {
    AuthenticationEntryPoint entryPoint = new GalleryAuthEntryPoint();
    http.csrf(AbstractHttpConfigurer::disable)
        .cors(Customizer.withDefaults())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
        .securityContext(context -> context.securityContextRepository(new RequestAttributeSecurityContextRepository()))
        .exceptionHandling(
            errors ->
                errors
                    .authenticationEntryPoint(entryPoint)
                    .accessDeniedHandler(
                        (request, response, exception) -> {
                          response.setStatus(403);
                          response.setContentType("application/json;charset=UTF-8");
                          response.getWriter().write("{\"message\":\"이 작업에 대한 권한이 없습니다.\"}");
                        }))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(HttpMethod.POST, "/api/galleries")
                    .hasAnyRole("MODERATOR", "ADMIN")
                    .requestMatchers(HttpMethod.GET, "/api/gallery-requests/mine")
                    .authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/gallery-requests")
                    .authenticated()
                    .requestMatchers("/api/gallery-requests", "/api/gallery-requests/**")
                    .hasAnyRole("MODERATOR", "ADMIN")
                    .requestMatchers("/api/members", "/api/members/**")
                    .hasRole("ADMIN")
                    .requestMatchers("/api/me")
                    .authenticated()
                    .anyRequest()
                    .permitAll())
        .oauth2ResourceServer(
            oauth ->
                oauth
                    .authenticationEntryPoint(entryPoint)
                    .bearerTokenResolver(galleryBearerTokenResolver)
                    .jwt(jwt -> jwt.decoder(galleryJwtDecoder).jwtAuthenticationConverter(jwtAuthentication)));

    if (clients.getIfAvailable() != null) {
      http.oauth2Login(
          oauth -> oauth.successHandler(googleLogin).failureHandler(googleLogin));
    }
    return http.build();
  }

  @Bean
  @ConditionalOnExpression(
      "T(org.springframework.util.StringUtils).hasText('${gallery.google.client-id:}') and T(org.springframework.util.StringUtils).hasText('${gallery.google.client-secret:}')")
  ClientRegistrationRepository clientRegistrationRepository(GalleryProperties properties) {
    ClientRegistration registration =
        ClientRegistration.withRegistrationId("google")
            .clientId(properties.getGoogle().getClientId())
            .clientSecret(properties.getGoogle().getClientSecret())
            .clientName("Google")
            .scope("openid", "profile", "email")
            .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
            .tokenUri("https://oauth2.googleapis.com/token")
            .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
            .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
            .userNameAttributeName("sub")
            .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .build();
    return new InMemoryClientRegistrationRepository(registration);
  }
}
