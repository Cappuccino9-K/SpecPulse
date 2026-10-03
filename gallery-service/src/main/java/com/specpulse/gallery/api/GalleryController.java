package com.specpulse.gallery.api;

import com.specpulse.gallery.service.ClientIds;
import com.specpulse.gallery.service.GalleryService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class GalleryController {
  private final GalleryService galleryService;

  public GalleryController(GalleryService galleryService) {
    this.galleryService = galleryService;
  }

  @GetMapping("/health")
  Map<String, String> health() {
    return Map.of("status", "up", "service", "gallery");
  }

  @GetMapping("/galleries")
  List<GalleryCard> galleries() {
    return galleryService.listGalleries();
  }

  @GetMapping("/galleries/{slug}")
  GalleryCard gallery(@PathVariable String slug) {
    return galleryService.getGallery(slug);
  }

  @GetMapping("/galleries/{slug}/posts")
  PostPage posts(
      @PathVariable String slug,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "15") int size) {
    return galleryService.listPosts(slug, page, size);
  }

  @PostMapping("/galleries/{slug}/posts")
  @ResponseStatus(HttpStatus.CREATED)
  PostDetail createPost(@PathVariable String slug, @Valid @RequestBody WritePostRequest request) {
    return galleryService.createPost(slug, request);
  }

  @GetMapping("/posts/{id}")
  PostDetail post(@PathVariable long id, @RequestHeader(value = "X-Client-Id", required = false) String clientId) {
    String checked = clientId == null || clientId.isBlank() ? null : ClientIds.require(clientId);
    return galleryService.getPost(id, checked);
  }

  @PostMapping("/posts/{id}/comments")
  @ResponseStatus(HttpStatus.CREATED)
  CommentView comment(@PathVariable long id, @Valid @RequestBody WriteCommentRequest request) {
    return galleryService.addComment(id, request);
  }

  @PostMapping("/posts/{id}/recommend")
  RecommendResult recommend(@PathVariable long id, @RequestHeader("X-Client-Id") String clientId) {
    return galleryService.recommend(id, ClientIds.require(clientId));
  }

  @PostMapping("/posts/{id}/delete")
  void deletePost(@PathVariable long id, @Valid @RequestBody DeleteRequest request) {
    galleryService.deletePost(id, request);
  }

  @PostMapping("/comments/{id}/delete")
  void deleteComment(@PathVariable long id, @Valid @RequestBody DeleteRequest request) {
    galleryService.deleteComment(id, request);
  }
}
