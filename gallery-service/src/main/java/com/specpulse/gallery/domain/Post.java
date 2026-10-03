package com.specpulse.gallery.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(
    name = "mg_post",
    indexes = @Index(name = "ix_mg_post_gallery_id", columnList = "gallery_id, id"))
public class Post {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "gallery_id", nullable = false)
  private Gallery gallery;

  @Column(nullable = false, length = 80)
  private String title;

  @Column(nullable = false, length = 4000)
  private String body;

  @Column(nullable = false, length = 16)
  private String author;

  @Column(nullable = false, length = 80)
  private String passwordHash;

  @Column(nullable = false)
  private int views;

  @Column(nullable = false)
  private int recommends;

  @Column(nullable = false)
  private Instant createdAt;

  public Long getId() {
    return id;
  }

  public Gallery getGallery() {
    return gallery;
  }

  public void setGallery(Gallery gallery) {
    this.gallery = gallery;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getBody() {
    return body;
  }

  public void setBody(String body) {
    this.body = body;
  }

  public String getAuthor() {
    return author;
  }

  public void setAuthor(String author) {
    this.author = author;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public int getViews() {
    return views;
  }

  public void setViews(int views) {
    this.views = views;
  }

  public int getRecommends() {
    return recommends;
  }

  public void setRecommends(int recommends) {
    this.recommends = recommends;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
