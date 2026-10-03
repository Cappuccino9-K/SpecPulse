package com.specpulse.gallery.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class ClientIdsTest {
  @Test
  void acceptsUuid() {
    assertEquals("11111111-2222-4333-8444-555555555555", ClientIds.require("11111111-2222-4333-8444-555555555555"));
  }

  @Test
  void rejectsShortToken() {
    assertThrows(ResponseStatusException.class, () -> ClientIds.require("abc"));
  }
}
