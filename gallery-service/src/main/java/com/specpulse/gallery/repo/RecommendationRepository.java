package com.specpulse.gallery.repo;

import com.specpulse.gallery.domain.Recommendation;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {
  Optional<Recommendation> findByPostIdAndClientId(Long postId, String clientId);

  boolean existsByPostIdAndClientId(Long postId, String clientId);

  void deleteByPostId(Long postId);
}
