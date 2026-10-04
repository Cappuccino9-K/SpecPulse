package com.specpulse.gallery.api;

import com.specpulse.gallery.domain.GalleryRequest;
import java.time.Instant;

public record GalleryRequestView(
    long id,
    String name,
    String slug,
    String description,
    String status,
    String requesterName,
    String requesterEmail,
    String reviewNote,
    Instant createdAt) {
  public static GalleryRequestView from(GalleryRequest request) {
    return new GalleryRequestView(
        request.getId(),
        request.getName(),
        request.getSlug(),
        request.getDescription(),
        request.getStatus().name(),
        request.getRequester().getName(),
        request.getRequester().getEmail(),
        request.getReviewNote(),
        request.getCreatedAt());
  }
}
