package com.specpulse.gallery;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.specpulse.gallery.api.ApiExceptionHandler;
import com.specpulse.gallery.api.GalleryCard;
import com.specpulse.gallery.api.GalleryController;
import com.specpulse.gallery.api.RecommendResult;
import com.specpulse.gallery.service.GalleryService;
import com.specpulse.gallery.security.GalleryJwtAuthentication;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan.Filter;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@WebMvcTest(
    controllers = GalleryController.class,
    excludeFilters = @Filter(type = FilterType.ASSIGNABLE_TYPE, classes = GalleryJwtAuthentication.class))
@AutoConfigureMockMvc(addFilters = false)
@Import(ApiExceptionHandler.class)
class GalleryControllerTest {
  @Autowired private MockMvc mvc;

  @MockBean private GalleryService galleryService;

  @Test
  void listsGalleries() throws Exception {
    when(galleryService.listGalleries())
        .thenReturn(
            List.of(new GalleryCard(1, "cpu", "CPU 마이너갤", "소켓과 클럭", 2, "7800X3D", Instant.parse("2026-10-01T00:00:00Z"))));

    mvc.perform(get("/api/galleries"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].slug").value("cpu"))
        .andExpect(jsonPath("$[0].name").value("CPU 마이너갤"));
  }

  @Test
  void rejectsShortPassword() throws Exception {
    mvc.perform(
            post("/api/galleries/cpu/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"author\":\"클럭\",\"password\":\"12\",\"title\":\"제목입니다\",\"body\":\"본문입니다\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("비밀번호는 4자 이상 32자 이하입니다."));
  }

  @Test
  void rejectsBadComparisonId() throws Exception {
    mvc.perform(
            post("/api/galleries/cpu/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"author\":\"클럭\",\"password\":\"1234\",\"title\":\"제목입니다\",\"body\":\"본문입니다\",\"comparisonId\":\"not-a-uuid\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("비교 번호 형식이 아닙니다."));
  }

  @Test
  void recommendNeedsClientId() throws Exception {
    mvc.perform(post("/api/posts/3/recommend")).andExpect(status().isBadRequest());
  }

  @Test
  void wrongPasswordIsUnauthorized() throws Exception {
    doThrow(new ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "비밀번호가 맞지 않습니다."))
        .when(galleryService)
        .deletePost(eq(3L), any());

    mvc.perform(
            post("/api/posts/3/delete")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"password\":\"nope\"}"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("비밀번호가 맞지 않습니다."));
  }
}
