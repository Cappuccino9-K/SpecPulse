package com.specpulse.gallery.api;

import java.time.Instant;

public record CommentView(long id, String author, String body, Instant createdAt) {}
