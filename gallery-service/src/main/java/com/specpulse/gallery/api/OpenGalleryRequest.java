package com.specpulse.gallery.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record OpenGalleryRequest(
    @NotBlank(message = "갤러리 이름을 입력해 주세요.")
        @Size(min = 2, max = 40, message = "갤러리 이름은 2자 이상 40자 이하입니다.")
        String name,
    @NotBlank(message = "갤러리 주소를 입력해 주세요.")
        @Size(min = 2, max = 40, message = "갤러리 주소는 2자 이상 40자 이하입니다.")
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "갤러리 주소는 영어 소문자와 숫자, 하이픈만 사용할 수 있습니다.")
        String slug,
    @NotBlank(message = "갤러리 설명을 입력해 주세요.")
        @Size(min = 2, max = 200, message = "갤러리 설명은 2자 이상 200자 이하입니다.")
        String description) {}
