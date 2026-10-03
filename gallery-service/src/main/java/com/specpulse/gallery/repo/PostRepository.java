package com.specpulse.gallery.repo;

import com.specpulse.gallery.domain.Post;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {
  Page<Post> findByGalleryIdOrderByIdDesc(Long galleryId, Pageable pageable);

  Optional<Post> findFirstByGalleryIdOrderByIdDesc(Long galleryId);

  long countByGalleryId(Long galleryId);

  Optional<Post> findByIdAndGalleryId(Long id, Long galleryId);
}
