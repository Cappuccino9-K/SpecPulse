package com.specpulse.gallery.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WritePostRequest(
    @NotBlank(message = "닉네임을 입력해 주세요.")
        @Size(min = 2, max = 16, message = "닉네임은 2자 이상 16자 이하입니다.")
        String author,
    @NotBlank(message = "비밀번호를 입력해 주세요.")
        @Size(min = 4, max = 32, message = "비밀번호는 4자 이상 32자 이하입니다.")
        String password,
    @NotBlank(message = "제목을 입력해 주세요.") @Size(min = 2, max = 80, message = "제목은 2자 이상 80자 이하입니다.")
        String title,
    @NotBlank(message = "본문을 입력해 주세요.") @Size(min = 2, max = 4000, message = "본문은 2자 이상 4000자 이하입니다.")
        String body) {}
