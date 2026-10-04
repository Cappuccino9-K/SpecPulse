package com.specpulse.gallery.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class GallerySlugsTest {
  @Test
  void acceptsHyphenatedSlug() {
    assertEquals("ddr5-ram", GallerySlugs.require("DDR5-RAM"));
  }

  @Test
  void rejectsReservedRoute() {
    assertThrows(ResponseStatusException.class, () -> GallerySlugs.require("requests"));
  }
}
