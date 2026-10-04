package com.specpulse.gallery.api;

import com.specpulse.gallery.config.GalleryProperties;
import com.specpulse.gallery.domain.AppUser;
import com.specpulse.gallery.repo.AppUserRepository;
import com.specpulse.gallery.security.CurrentAccounts;
import com.specpulse.gallery.service.AccountService;
import com.specpulse.gallery.service.GalleryRequestService;
import com.specpulse.gallery.service.GalleryService;
import jakarta.validation.Valid;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AccountController {
  private static final Logger log = LoggerFactory.getLogger(AccountController.class);
  private final GalleryProperties properties;
  private final AppUserRepository users;
  private final AccountService accounts;
  private final GalleryService galleries;
  private final GalleryRequestService requests;

  public AccountController(
      GalleryProperties properties,
      AppUserRepository users,
      AccountService accounts,
      GalleryService galleries,
      GalleryRequestService requests) {
    this.properties = properties;
    this.users = users;
    this.accounts = accounts;
    this.galleries = galleries;
    this.requests = requests;
  }

  @GetMapping("/auth/config")
  AuthConfigView config() {
    boolean enabled = properties.googleEnabled();
    log.info("로그인 설정 요청: 구글 {}", enabled ? "사용" : "꺼짐");
    String base = properties.getPublicUrl() == null ? "http://127.0.0.1:18766" : properties.getPublicUrl().replaceAll("/$", "");
    return new AuthConfigView(enabled, base + "/oauth2/authorization/google");
  }

  @GetMapping("/me")
  MeView me() {
    return MeView.from(CurrentAccounts.require());
  }

  @GetMapping("/members")
  List<MemberView> members() {
    return users.findAll().stream().map(MemberView::from).toList();
  }

  @PatchMapping("/members/{id}/role")
  MemberView role(@PathVariable long id, @Valid @RequestBody RoleUpdateRequest body) {
    AppUser updated = accounts.changeRole(CurrentAccounts.require(), id, body.role());
    return MemberView.from(updated);
  }

  @PostMapping("/galleries")
  @ResponseStatus(HttpStatus.CREATED)
  GalleryCard open(@Valid @RequestBody OpenGalleryRequest body) {
    return galleries.openGallery(body.name(), body.slug(), body.description());
  }

  @PostMapping("/gallery-requests")
  @ResponseStatus(HttpStatus.CREATED)
  GalleryRequestView requestGallery(@Valid @RequestBody OpenGalleryRequest body) {
    return GalleryRequestView.from(requests.submit(CurrentAccounts.require(), body.name(), body.slug(), body.description()));
  }

  @GetMapping("/gallery-requests/mine")
  List<GalleryRequestView> mine() {
    return requests.mine(CurrentAccounts.require()).stream().map(GalleryRequestView::from).toList();
  }

  @GetMapping("/gallery-requests")
  List<GalleryRequestView> queue() {
    return requests.pending().stream().map(GalleryRequestView::from).toList();
  }

  @PostMapping("/gallery-requests/{id}/approve")
  GalleryRequestView approve(@PathVariable long id) {
    return GalleryRequestView.from(requests.approve(CurrentAccounts.require(), id));
  }

  @PostMapping("/gallery-requests/{id}/reject")
  GalleryRequestView reject(@PathVariable long id, @Valid @RequestBody(required = false) RejectRequest body) {
    String note = body == null ? null : body.note();
    return GalleryRequestView.from(requests.reject(CurrentAccounts.require(), id, note));
  }
}
