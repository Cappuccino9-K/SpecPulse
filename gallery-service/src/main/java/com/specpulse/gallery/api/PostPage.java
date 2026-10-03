package com.specpulse.gallery.api;

import java.util.List;

public record PostPage(GalleryCard gallery, List<PostSummary> posts, int page, int size, long total) {}
