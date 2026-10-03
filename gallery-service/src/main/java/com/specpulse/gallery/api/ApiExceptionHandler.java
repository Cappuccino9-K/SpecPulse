package com.specpulse.gallery.api;

import java.util.Map;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<Map<String, String>> invalid(MethodArgumentNotValidException ex) {
    String message =
        ex.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getDefaultMessage())
            .filter(Objects::nonNull)
            .findFirst()
            .orElse("입력값을 확인해 주세요.");
    return ResponseEntity.badRequest().body(Map.of("message", message));
  }

  @ExceptionHandler(MissingRequestHeaderException.class)
  ResponseEntity<Map<String, String>> missingHeader(MissingRequestHeaderException ex) {
    return ResponseEntity.badRequest().body(Map.of("message", "브라우저 식별자가 없습니다. 페이지를 새로고침해 주세요."));
  }

  @ExceptionHandler(ResponseStatusException.class)
  ResponseEntity<Map<String, String>> status(ResponseStatusException ex) {
    String message = ex.getReason() == null ? "요청을 처리하지 못했습니다." : ex.getReason();
    HttpStatus http = HttpStatus.resolve(ex.getStatusCode().value());
    if (http == null) {
      return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", message));
    }
    return ResponseEntity.status(http).body(Map.of("message", message));
  }
}
