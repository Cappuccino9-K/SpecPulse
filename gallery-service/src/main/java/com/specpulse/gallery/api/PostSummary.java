package com.specpulse.gallery.api;

import java.time.Instant;

public record PostSummary(
    long id,
    String title,
    String author,
    Instant createdAt,
    int views,
    int recommends,
    long commentCount,
    String comparisonId) {}
