package com.specpulse.gallery.service;

import com.specpulse.gallery.api.CommentView;
import com.specpulse.gallery.api.DeleteRequest;
import com.specpulse.gallery.api.GalleryCard;
import com.specpulse.gallery.api.PostDetail;
import com.specpulse.gallery.api.PostPage;
import com.specpulse.gallery.api.PostSummary;
import com.specpulse.gallery.api.RecommendResult;
import com.specpulse.gallery.api.WriteCommentRequest;
import com.specpulse.gallery.api.WritePostRequest;
import com.specpulse.gallery.domain.Comment;
import com.specpulse.gallery.domain.Gallery;
import com.specpulse.gallery.domain.Post;
import com.specpulse.gallery.domain.Recommendation;
import com.specpulse.gallery.repo.CommentRepository;
import com.specpulse.gallery.repo.GalleryRepository;
import com.specpulse.gallery.repo.PostRepository;
import com.specpulse.gallery.repo.RecommendationRepository;
import java.time.Instant;
import java.util.HashMap;
import java.util.UUID;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GalleryService {
  private final GalleryRepository galleries;
  private final PostRepository posts;
  private final CommentRepository comments;
  private final RecommendationRepository recommendations;
  private final PasswordEncoder passwords;

  public GalleryService(
      GalleryRepository galleries,
      PostRepository posts,
      CommentRepository comments,
      RecommendationRepository recommendations,
      PasswordEncoder passwords) {
    this.galleries = galleries;
    this.posts = posts;
    this.comments = comments;
    this.recommendations = recommendations;
    this.passwords = passwords;
  }

  @Transactional(readOnly = true)
  public List<GalleryCard> listGalleries() {
    return galleries.findAll().stream().map(this::toCard).toList();
  }

  @Transactional(readOnly = true)
  public GalleryCard getGallery(String slug) {
    return toCard(requireGallery(slug));
  }

  @Transactional
  public GalleryCard openGallery(String name, String slug, String description) {
    String cleanSlug = GallerySlugs.require(slug);
    if (galleries.findBySlug(cleanSlug).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 있는 갤러리 주소입니다.");
    }
    Gallery gallery = new Gallery();
    gallery.setSlug(cleanSlug);
    gallery.setName(name.trim());
    gallery.setDescription(description.trim());
    gallery.setCreatedAt(Instant.now());
    return toCard(galleries.save(gallery));
  }

  @Transactional(readOnly = true)
  public PostPage listPosts(String slug, int page, int size) {
    Gallery gallery = requireGallery(slug);
    int safePage = Math.max(page, 1);
    int safeSize = Math.min(Math.max(size, 1), 50);
    Page<Post> result = posts.findByGalleryIdOrderByIdDesc(gallery.getId(), PageRequest.of(safePage - 1, safeSize));
    Map<Long, Long> counts = commentCounts(result.getContent());
    List<PostSummary> items = result.getContent().stream().map(post -> toSummary(post, counts)).toList();
    return new PostPage(toCard(gallery), items, safePage, safeSize, result.getTotalElements());
  }

  @Transactional
  public PostDetail createPost(String slug, WritePostRequest request) {
    Gallery gallery = requireGallery(slug);
    Post post = new Post();
    post.setGallery(gallery);
    post.setTitle(request.title().trim());
    post.setBody(request.body().trim());
    post.setAuthor(request.author().trim());
    post.setPasswordHash(passwords.encode(request.password()));
    post.setViews(0);
    post.setRecommends(0);
    post.setCreatedAt(Instant.now());
    post.setComparisonId(cleanComparisonId(request.comparisonId()));
    posts.save(post);
    return toDetail(post, false);
  }

  @Transactional
  public PostDetail getPost(long id, String clientId) {
    Post post = requirePost(id);
    post.setViews(post.getViews() + 1);
    boolean recommended = clientId != null && recommendations.existsByPostIdAndClientId(id, clientId);
    return toDetail(post, recommended);
  }

  @Transactional
  public CommentView addComment(long postId, WriteCommentRequest request) {
    Post post = requirePost(postId);
    Comment comment = new Comment();
    comment.setPost(post);
    comment.setAuthor(request.author().trim());
    comment.setBody(request.body().trim());
    comment.setPasswordHash(passwords.encode(request.password()));
    comment.setCreatedAt(Instant.now());
    comments.save(comment);
    return toComment(comment);
  }

  @Transactional
  public RecommendResult recommend(long postId, String clientId) {
    Post post = requirePost(postId);
    var existing = recommendations.findByPostIdAndClientId(postId, clientId);
    if (existing.isPresent()) {
      recommendations.delete(existing.get());
      post.setRecommends(Math.max(0, post.getRecommends() - 1));
      return new RecommendResult(false, post.getRecommends());
    }
    Recommendation row = new Recommendation();
    row.setPost(post);
    row.setClientId(clientId);
    row.setCreatedAt(Instant.now());
    recommendations.save(row);
    post.setRecommends(post.getRecommends() + 1);
    return new RecommendResult(true, post.getRecommends());
  }

  @Transactional
  public void deletePost(long id, DeleteRequest request) {
    Post post = requirePost(id);
    if (!passwords.matches(request.password(), post.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "비밀번호가 맞지 않습니다.");
    }
    comments.deleteAll(comments.findByPostIdOrderByIdAsc(id));
    recommendations.deleteByPostId(id);
    posts.delete(post);
  }

  @Transactional
  public void deleteComment(long id, DeleteRequest request) {
    Comment comment =
        comments
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글을 찾지 못했습니다."));
    if (!passwords.matches(request.password(), comment.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "비밀번호가 맞지 않습니다.");
    }
    comments.delete(comment);
  }

  private Gallery requireGallery(String slug) {
    return galleries
        .findBySlug(slug)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "갤러리를 찾지 못했습니다."));
  }

  private Post requirePost(long id) {
    return posts
        .findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "글을 찾지 못했습니다."));
  }

  private GalleryCard toCard(Gallery gallery) {
    long count = posts.countByGalleryId(gallery.getId());
    Post latest = posts.findFirstByGalleryIdOrderByIdDesc(gallery.getId()).orElse(null);
    return new GalleryCard(
        gallery.getId(),
        gallery.getSlug(),
        gallery.getName(),
        gallery.getDescription(),
        count,
        latest == null ? null : latest.getTitle(),
        latest == null ? null : latest.getCreatedAt());
  }

  private Map<Long, Long> commentCounts(List<Post> page) {
    if (page.isEmpty()) return Map.of();
    List<Long> ids = page.stream().map(Post::getId).toList();
    Map<Long, Long> counts = new HashMap<>();
    for (Object[] row : comments.countByPostIds(ids)) {
      counts.put((Long) row[0], (Long) row[1]);
    }
    return counts;
  }

  private PostSummary toSummary(Post post, Map<Long, Long> counts) {
    return new PostSummary(
        post.getId(),
        post.getTitle(),
        post.getAuthor(),
        post.getCreatedAt(),
        post.getViews(),
        post.getRecommends(),
        counts.getOrDefault(post.getId(), 0L),
        post.getComparisonId());
  }

  private PostDetail toDetail(Post post, boolean recommended) {
    List<CommentView> thread = comments.findByPostIdOrderByIdAsc(post.getId()).stream().map(this::toComment).toList();
    return new PostDetail(
        post.getId(),
        post.getGallery().getSlug(),
        post.getGallery().getName(),
        post.getTitle(),
        post.getBody(),
        post.getAuthor(),
        post.getCreatedAt(),
        post.getViews(),
        post.getRecommends(),
        recommended,
        thread,
        post.getComparisonId());
  }

  private static String cleanComparisonId(String raw) {
    if (raw == null || raw.isBlank()) return null;
    try {
      return UUID.fromString(raw.trim()).toString();
    } catch (IllegalArgumentException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비교 번호 형식이 아닙니다.");
    }
  }

  private CommentView toComment(Comment comment) {
    return new CommentView(comment.getId(), comment.getAuthor(), comment.getBody(), comment.getCreatedAt());
  }
}
