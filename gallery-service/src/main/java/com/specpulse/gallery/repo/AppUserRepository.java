package com.specpulse.gallery.repo;

import com.specpulse.gallery.domain.AppUser;
import com.specpulse.gallery.domain.GalleryRole;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
  Optional<AppUser> findByGoogleSub(String googleSub);

  Optional<AppUser> findByEmailIgnoreCase(String email);

  long countByRole(GalleryRole role);
}
