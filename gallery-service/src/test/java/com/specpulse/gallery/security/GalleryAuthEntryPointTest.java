package com.specpulse.gallery.security;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InsufficientAuthenticationException;

class GalleryAuthEntryPointTest {
  private final GalleryAuthEntryPoint entryPoint = new GalleryAuthEntryPoint();

  @Test
  void missingLoginIsJson() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    MockHttpServletResponse response = new MockHttpServletResponse();

    entryPoint.commence(request, response, new InsufficientAuthenticationException("Full authentication is required"));

    assertEquals(401, response.getStatus());
    assertEquals("{\"message\":\"로그인이 필요합니다.\"}", response.getContentAsString());
  }

  @Test
  void rejectedBearerIsJson() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("Authorization", "Bearer not-a-jwt");
    MockHttpServletResponse response = new MockHttpServletResponse();

    entryPoint.commence(request, response, new BadCredentialsException("Malformed token"));

    assertEquals(401, response.getStatus());
    assertEquals("{\"message\":\"로그인이 만료되었습니다. 다시 로그인해 주세요.\"}", response.getContentAsString());
  }
}
