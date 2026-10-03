package com.specpulse.gallery.seed;

import com.specpulse.gallery.domain.Comment;
import com.specpulse.gallery.domain.Gallery;
import com.specpulse.gallery.domain.Post;
import com.specpulse.gallery.repo.CommentRepository;
import com.specpulse.gallery.repo.GalleryRepository;
import com.specpulse.gallery.repo.PostRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class GallerySeed implements ApplicationRunner {
  private final GalleryRepository galleries;
  private final PostRepository posts;
  private final CommentRepository comments;
  private final PasswordEncoder passwords;

  public GallerySeed(
      GalleryRepository galleries, PostRepository posts, CommentRepository comments, PasswordEncoder passwords) {
    this.galleries = galleries;
    this.posts = posts;
    this.comments = comments;
    this.passwords = passwords;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (galleries.count() > 0) return;
    String locked = passwords.encode(UUID.randomUUID().toString());
    Gallery cpu = board("cpu", "CPU 마이너갤", "소켓, 클럭, 전성비. 벤치 한 장보다 실사용이 먼저입니다.");
    Gallery gpu = board("gpu", "그래픽카드 마이너갤", "중고 시세, 전력, 길이. 케이스에 들어가는지가 스펙표보다 급합니다.");
    Gallery notebook = board("notebook", "노트북 마이너갤", "무게, 화면, 배터리. 매장 실측이 카탈로그를 이깁니다.");
    Gallery ram = board("ram", "메모리 마이너갤", "클럭, 타이밍, 온보드. 증설이 되는 노트북인지부터 확인합니다.");

    Post cache = write(cpu, "클럭요정", "7800X3D랑 9800X3D, 게임만 보면 어디인가요", "1080p 경쟁전 위주입니다. 캐시가 큰 쪽이 프레임은 잘 나온다는 글은 봤는데, 보드를 새로 사야 하면 가격 차이가 체감되는지 궁금합니다. 인코딩은 거의 안 합니다.", locked, 18, 7);
    write(cpu, "전성비", "14세대 전력제한 거신 분 계신가요", "PL1을 낮추면 발열은 잡히는데 시네벤치가 너무 빠집니다. 게임만 할 때 제한값이 어느 정도였는지 적어두신 설정이 있으면 보고 싶습니다.", locked, 11, 3);
    Post used = write(gpu, "보드걷어", "4070 Super 중고, 이 가격이면 사도 될까요", "개인거래로 52만 원입니다. 박스와 구매일이 남아 있고 채굴 이력은 없다고 합니다. 같은 시기 매물 보신 분들은 어느 선에서 보고 계신가요.", locked, 24, 9);
    write(gpu, "납땜주의", "파워 750W면 5070이 버티나요", "시소닉 750W 골드에 라이젠 7600입니다. 권장 750W라고 적혀 있어도 순간 전력이 걱정됩니다. 같은 조합으로 쓰시는 분 계시면 피크만 알려 주세요.", locked, 15, 4);
    write(notebook, "그램러", "그램이랑 갤북, 실측 무게가 카탈로그랑 같나요", "어댑터 빼고 본체만 재 보신 분. 14인치끼리 비교했는데 매장 샘플은 둘 다 카탈로그보다 무거워 보였습니다.", locked, 9, 2);
    write(notebook, "배터리", "맥북 에어 16GB, 탭이 40개면 부족한가요", "브라우저랑 문서가 전부입니다. 영상 편집은 없습니다. 24GB로 올려야 하는지, 16GB로 2년은 가는지 사용기 부탁드립니다.", locked, 13, 5);
    write(ram, "타이밍", "DDR5-6000 CL30이 5600 CL36이랑 체감 되나요", "7800X3D에 EXPO만 켰습니다. 게임 프레임은 거의 같다는 말이 많아서, 차이나는 작업이 있는지 궁금합니다.", locked, 8, 1);
    write(ram, "온보드", "램 납땜 노트북은 구매 전에 어디서 확인하나요", "스펙표에 온보드라고 안 적힌 모델도 분해하면 슬롯이 없는 경우가 있습니다. 다나와 상세에 안 나오면 제조사 메뉴얼까지 보시는 편인가요.", locked, 21, 6);

    reply(cache, "보드걷어", "게임만이면 7800X3D로 충분했고, 보드는 B650이면 그대로 갔습니다.", locked);
    reply(used, "전성비", "같은 주 개인거래는 48에서 55 사이였습니다. 구매일이 1년 안쪽이면 그 가격도 봤어요.", locked);
  }

  private Gallery board(String slug, String name, String description) {
    Gallery gallery = new Gallery();
    gallery.setSlug(slug);
    gallery.setName(name);
    gallery.setDescription(description);
    gallery.setCreatedAt(Instant.now());
    return galleries.save(gallery);
  }

  private Post write(Gallery gallery, String author, String title, String body, String hash, int views, int recommends) {
    Post post = new Post();
    post.setGallery(gallery);
    post.setAuthor(author);
    post.setTitle(title);
    post.setBody(body);
    post.setPasswordHash(hash);
    post.setViews(views);
    post.setRecommends(recommends);
    post.setCreatedAt(Instant.now());
    return posts.save(post);
  }

  private void reply(Post post, String author, String body, String hash) {
    Comment comment = new Comment();
    comment.setPost(post);
    comment.setAuthor(author);
    comment.setBody(body);
    comment.setPasswordHash(hash);
    comment.setCreatedAt(Instant.now());
    comments.save(comment);
  }
}
