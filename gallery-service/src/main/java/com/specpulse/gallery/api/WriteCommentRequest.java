package com.specpulse.gallery.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WriteCommentRequest(
    @NotBlank(message = "닉네임을 입력해 주세요.")
        @Size(min = 2, max = 16, message = "닉네임은 2자 이상 16자 이하입니다.")
        String author,
    @NotBlank(message = "비밀번호를 입력해 주세요.")
        @Size(min = 4, max = 32, message = "비밀번호는 4자 이상 32자 이하입니다.")
        String password,
    @NotBlank(message = "댓글을 입력해 주세요.") @Size(min = 1, max = 500, message = "댓글은 500자 이하입니다.")
        String body) {}
