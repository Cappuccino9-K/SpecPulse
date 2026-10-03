package com.specpulse.gallery.api;

import java.time.Instant;

public record GalleryCard(
    long id, String slug, String name, String description, long postCount, String latestTitle, Instant latestAt) {}
