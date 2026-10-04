package com.specpulse.gallery.repo;

import com.specpulse.gallery.domain.GalleryRequest;
import com.specpulse.gallery.domain.RequestStatus;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GalleryRequestRepository extends JpaRepository<GalleryRequest, Long> {
  @EntityGraph(attributePaths = "requester")
  List<GalleryRequest> findByStatusOrderByIdDesc(RequestStatus status);

  @EntityGraph(attributePaths = "requester")
  List<GalleryRequest> findByRequesterIdOrderByIdDesc(Long requesterId);

  boolean existsBySlugAndStatus(String slug, RequestStatus status);
}
