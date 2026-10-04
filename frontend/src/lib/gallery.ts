import type { CommentView, GalleryCard, PostDetail, PostPage, RecommendResult } from "@/types/gallery";
import type { AuthConfig, GalleryDraft, GalleryRequestItem, GalleryRole, Member } from "@/types/account";
import { currentToken, notifySession } from "@/lib/session";

const CLIENT_KEY = "specpulse-gallery-client";

export function galleryClientId(): string {
  const existing = localStorage.getItem(CLIENT_KEY);
  if (existing && /^[A-Za-z0-9-]{8,64}$/.test(existing)) return existing;
  const next = crypto.randomUUID();
  localStorage.setItem(CLIENT_KEY, next);
  return next;
}

async function fail(response: Response, fallback: string): Promise<never> {
  try {
    const data = (await response.json()) as { message?: string };
    if (data.message) throw new Error(data.message);
  } catch (error) {
    if (error instanceof Error && error.message && !error.message.startsWith("Unexpected")) throw error;
  }
  throw new Error(fallback);
}

async function request<T>(
  path: string,
  init?: RequestInit,
  fallback = "마이너갤 요청을 처리하지 못했습니다.",
  options?: { authenticated?: boolean; quiet?: boolean },
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (options?.authenticated && typeof window !== "undefined" && !headers.has("Authorization")) {
    const token = currentToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  let response: Response;
  try {
    response = await fetch(path, { cache: "no-store", credentials: "same-origin", ...init, headers });
  } catch {
    throw new Error("마이너갤 서버에 연결하지 못했습니다. JDK 17 이상이 있고 start.bat이 갤러리를 띄웠는지 확인해 주세요.");
  }
  if (response.status === 401 && options?.authenticated && !options.quiet && typeof window !== "undefined") {
    notifySession();
  }
  if (!response.ok) {
    const authFallback = response.status === 401 ? "로그인이 만료되었습니다. 다시 로그인해 주세요." : fallback;
    return fail(response, authFallback);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export function fetchGalleries(): Promise<GalleryCard[]> {
  return request("/gallery-api/galleries");
}

export function fetchPosts(slug: string, page: number): Promise<PostPage> {
  return request(`/gallery-api/galleries/${encodeURIComponent(slug)}/posts?page=${page}&size=15`);
}

export function fetchPost(id: number): Promise<PostDetail> {
  return request(`/gallery-api/posts/${id}`, { headers: { "X-Client-Id": galleryClientId() } });
}

export function createPost(
  slug: string,
  body: { author: string; password: string; title: string; body: string; comparisonId?: string },
): Promise<PostDetail> {
  return request(`/gallery-api/galleries/${encodeURIComponent(slug)}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function createComment(postId: number, body: { author: string; password: string; body: string }): Promise<CommentView> {
  return request(`/gallery-api/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function recommendPost(postId: number): Promise<RecommendResult> {
  return request(`/gallery-api/posts/${postId}/recommend`, {
    method: "POST",
    headers: { "X-Client-Id": galleryClientId() },
  });
}

export function deletePost(postId: number, password: string): Promise<void> {
  return request(`/gallery-api/posts/${postId}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

export function deleteComment(commentId: number, password: string): Promise<void> {
  return request(`/gallery-api/comments/${commentId}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

export function boardTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  }
  return new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit" }).format(date);
}

const GALLERY_ORIGIN = "http://127.0.0.1:18766";

export async function fetchAuthConfig(): Promise<AuthConfig> {
  const stamp = Date.now();
  const urls =
    typeof window === "undefined"
      ? [`${process.env.GALLERY_PROXY_TARGET ?? GALLERY_ORIGIN}/api/auth/config?fresh=${stamp}`]
      : [`/gallery-api/auth/config?fresh=${stamp}`, `${GALLERY_ORIGIN}/api/auth/config?fresh=${stamp}`];
  const results = await Promise.allSettled(
    urls.map((url) =>
      request<AuthConfig>(url, { headers: { Accept: "application/json" } }, "로그인 설정을 불러오지 못했습니다."),
    ),
  );
  const configs = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  const enabled = configs.find((config) => config.googleEnabled === true);
  if (enabled) return enabled;
  if (configs[0]) return configs[0];
  const rejected = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
  throw rejected?.reason instanceof Error ? rejected.reason : new Error("로그인 설정을 불러오지 못했습니다.");
}

export function fetchMe(): Promise<{ id: number; email: string; name: string; picture: string | null; role: GalleryRole }> {
  return request("/gallery-api/me", undefined, "로그인이 필요합니다.", { authenticated: true, quiet: true });
}

export function endSession(): Promise<void> {
  return fetch("/gallery-api/logout", { method: "POST", credentials: "same-origin", cache: "no-store" })
    .then(() => undefined)
    .catch(() => undefined);
}

export function openGallery(body: GalleryDraft): Promise<GalleryCard> {
  return request("/gallery-api/galleries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, "마이너갤 요청을 처리하지 못했습니다.", { authenticated: true });
}

export function requestGallery(body: GalleryDraft): Promise<GalleryRequestItem> {
  return request("/gallery-api/gallery-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, "마이너갤 요청을 처리하지 못했습니다.", { authenticated: true });
}

export function fetchMyRequests(): Promise<GalleryRequestItem[]> {
  return request("/gallery-api/gallery-requests/mine", undefined, "마이너갤 요청을 처리하지 못했습니다.", { authenticated: true });
}

export function fetchRequestQueue(): Promise<GalleryRequestItem[]> {
  return request("/gallery-api/gallery-requests", undefined, "마이너갤 요청을 처리하지 못했습니다.", { authenticated: true });
}

export function approveRequest(id: number): Promise<GalleryRequestItem> {
  return request(`/gallery-api/gallery-requests/${id}/approve`, { method: "POST" }, "마이너갤 요청을 처리하지 못했습니다.", { authenticated: true });
}

export function rejectRequest(id: number, note: string): Promise<GalleryRequestItem> {
  return request(`/gallery-api/gallery-requests/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  }, "마이너갤 요청을 처리하지 못했습니다.", { authenticated: true });
}

export function fetchMembers(): Promise<Member[]> {
  return request("/gallery-api/members", undefined, "마이너갤 요청을 처리하지 못했습니다.", { authenticated: true });
}

export function updateMemberRole(id: number, role: GalleryRole): Promise<Member> {
  return request(`/gallery-api/members/${id}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  }, "마이너갤 요청을 처리하지 못했습니다.", { authenticated: true });
}

