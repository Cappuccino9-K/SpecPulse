import type { CommentView, GalleryCard, PostDetail, PostPage, RecommendResult } from "@/types/gallery";

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

async function request<T>(path: string, init?: RequestInit, fallback = "마이너갤 요청을 처리하지 못했습니다."): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { cache: "no-store", ...init });
  } catch {
    throw new Error("마이너갤 서버에 연결하지 못했습니다. JDK 17 이상이 있고 start.bat이 갤러리를 띄웠는지 확인해 주세요.");
  }
  if (!response.ok) return fail(response, fallback);
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

export function createPost(slug: string, body: { author: string; password: string; title: string; body: string }): Promise<PostDetail> {
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
