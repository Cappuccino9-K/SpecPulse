package com.specpulse.gallery.api;

import java.time.Instant;
import java.util.List;

public record PostDetail(
    long id,
    String gallerySlug,
    String galleryName,
    String title,
    String body,
    String author,
    Instant createdAt,
    int views,
    int recommends,
    boolean recommended,
    List<CommentView> comments) {}
