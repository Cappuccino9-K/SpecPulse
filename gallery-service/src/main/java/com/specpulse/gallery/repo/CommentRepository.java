package com.specpulse.gallery.repo;

import com.specpulse.gallery.domain.Comment;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CommentRepository extends JpaRepository<Comment, Long> {
  List<Comment> findByPostIdOrderByIdAsc(Long postId);

  long countByPostId(Long postId);

  @Query("select c.post.id, count(c) from Comment c where c.post.id in :postIds group by c.post.id")
  List<Object[]> countByPostIds(Collection<Long> postIds);
}
