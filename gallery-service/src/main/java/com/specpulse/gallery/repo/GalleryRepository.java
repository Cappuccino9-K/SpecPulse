package com.specpulse.gallery.repo;

import com.specpulse.gallery.domain.Gallery;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GalleryRepository extends JpaRepository<Gallery, Long> {
  Optional<Gallery> findBySlug(String slug);

  long countBySlug(String slug);
}
