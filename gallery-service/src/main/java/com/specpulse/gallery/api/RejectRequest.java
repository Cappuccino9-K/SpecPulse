package com.specpulse.gallery.api;

import jakarta.validation.constraints.Size;

public record RejectRequest(@Size(max = 200, message = "거절 이유는 200자 이하입니다.") String note) {}
