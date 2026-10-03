package com.specpulse.gallery.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeleteRequest(
    @NotBlank(message = "비밀번호를 입력해 주세요.")
        @Size(min = 4, max = 32, message = "비밀번호는 4자 이상 32자 이하입니다.")
        String password) {}
