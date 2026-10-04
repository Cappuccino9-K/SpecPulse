package com.specpulse.gallery.api;

import com.specpulse.gallery.domain.GalleryRole;
import jakarta.validation.constraints.NotNull;

public record RoleUpdateRequest(@NotNull(message = "역할을 선택해 주세요.") GalleryRole role) {}
