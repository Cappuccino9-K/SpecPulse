package com.specpulse.gallery.service;

import com.specpulse.gallery.domain.AppUser;
import com.specpulse.gallery.domain.GalleryRequest;
import com.specpulse.gallery.domain.GalleryRole;
import com.specpulse.gallery.domain.RequestStatus;
import com.specpulse.gallery.repo.GalleryRequestRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GalleryRequestService {
  private final GalleryRequestRepository requests;
  private final GalleryService galleries;

  public GalleryRequestService(GalleryRequestRepository requests, GalleryService galleries) {
    this.requests = requests;
    this.galleries = galleries;
  }

  @Transactional
  public GalleryRequest submit(AppUser requester, String name, String slug, String description) {
    String cleanSlug = GallerySlugs.require(slug);
    if (requests.existsBySlugAndStatus(cleanSlug, RequestStatus.PENDING)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "같은 주소로 대기 중인 요청이 있습니다.");
    }
    GalleryRequest request = new GalleryRequest();
    request.setRequester(requester);
    request.setName(name.trim());
    request.setSlug(cleanSlug);
    request.setDescription(description.trim());
    request.setStatus(RequestStatus.PENDING);
    request.setCreatedAt(Instant.now());
    GalleryRequest saved = requests.save(request);
    saved.getRequester().getEmail();
    return saved;
  }

  @Transactional(readOnly = true)
  public List<GalleryRequest> pending() {
    return requests.findByStatusOrderByIdDesc(RequestStatus.PENDING);
  }

  @Transactional(readOnly = true)
  public List<GalleryRequest> mine(AppUser requester) {
    return requests.findByRequesterIdOrderByIdDesc(requester.getId());
  }

  @Transactional
  public GalleryRequest approve(AppUser reviewer, long id) {
    GalleryRequest request = requirePending(id);
    galleries.openGallery(request.getName(), request.getSlug(), request.getDescription());
    request.setStatus(RequestStatus.APPROVED);
    request.setReviewer(reviewer);
    request.setReviewedAt(Instant.now());
    request.getRequester().getEmail();
    return requests.save(request);
  }

  @Transactional
  public GalleryRequest reject(AppUser reviewer, long id, String note) {
    GalleryRequest request = requirePending(id);
    request.setStatus(RequestStatus.REJECTED);
    request.setReviewer(reviewer);
    request.setReviewNote(note == null || note.isBlank() ? null : note.trim());
    request.setReviewedAt(Instant.now());
    request.getRequester().getEmail();
    return requests.save(request);
  }

  public static boolean canOpenGallery(GalleryRole role) {
    return role == GalleryRole.ADMIN || role == GalleryRole.MODERATOR;
  }

  private GalleryRequest requirePending(long id) {
    GalleryRequest request =
        requests.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "요청을 찾지 못했습니다."));
    if (request.getStatus() != RequestStatus.PENDING) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 처리된 요청입니다.");
    }
    return request;
  }
}
