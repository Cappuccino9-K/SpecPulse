"use client";

import { ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ComparisonExcerpt } from "@/components/gallery/comparison-excerpt";
import { SiteHeader } from "@/components/site-header";
import { boardTime, createComment, deleteComment, deletePost, fetchPost, recommendPost } from "@/lib/gallery";
import type { PostDetail } from "@/types/gallery";

export function PostView({ slug, postId }: { slug: string; postId: number }) {
  const router = useRouter();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [author, setAuthor] = useState("");
  const [password, setPassword] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [commentDelete, setCommentDelete] = useState<number | null>(null);
  const [commentPassword, setCommentPassword] = useState("");

  useEffect(() => {
    fetchPost(postId)
      .then(setPost)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "글을 열지 못했습니다."));
  }, [postId]);

  async function onRecommend() {
    setActionError("");
    try {
      const result = await recommendPost(postId);
      setPost((current) => (current ? { ...current, recommended: result.recommended, recommends: result.count } : current));
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "추천을 반영하지 못했습니다.");
    }
  }

  async function onComment(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setActionError("");
    try {
      const created = await createComment(postId, { author, password, body });
      setPost((current) => (current ? { ...current, comments: [...current.comments, created] } : current));
      setBody("");
      setPassword("");
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "댓글을 올리지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  async function onDeletePost(event: React.FormEvent) {
    event.preventDefault();
    setActionError("");
    try {
      await deletePost(postId, deletePassword);
      router.push(`/gallery/${slug}`);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "글을 지우지 못했습니다.");
    }
  }

  async function onDeleteComment(event: React.FormEvent) {
    event.preventDefault();
    if (commentDelete == null) return;
    setActionError("");
    try {
      await deleteComment(commentDelete, commentPassword);
      setPost((current) =>
        current ? { ...current, comments: current.comments.filter((item) => item.id !== commentDelete) } : current,
      );
      setCommentDelete(null);
      setCommentPassword("");
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "댓글을 지우지 못했습니다.");
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Link href={`/gallery/${slug}`} className="text-xs font-medium text-primary">
          {post?.galleryName ?? "목록"}으로
        </Link>

        {error ? (
          <p role="alert" className="mt-4 rounded-2xl border border-danger/30 bg-danger-container px-4 py-3 text-sm text-on-danger-container">
            {error}
          </p>
        ) : null}

        {!post && !error ? <p className="mt-4 text-sm text-muted">글을 불러오는 중입니다.</p> : null}

        {post ? (
          <article className="mt-3 rounded-2xl border border-line bg-surface p-4 elev-1 sm:p-6">
            <h1 className="text-xl font-bold leading-snug">{post.title}</h1>
            <p className="mt-2 text-xs text-muted">
              {post.author} · {boardTime(post.createdAt)} · 조회 {post.views} · 추천 {post.recommends}
            </p>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-7">{post.body}</p>
            {post.comparisonId ? <ComparisonExcerpt comparisonId={post.comparisonId} /> : null}
            <button
              type="button"
              onClick={onRecommend}
              className={`mt-6 inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${
                post.recommended ? "border-primary bg-primary-container text-on-primary-container" : "border-line bg-surface"
              }`}
            >
              <ThumbsUp className="size-4" />
              {post.recommended ? "추천 취소" : "추천"} {post.recommends}
            </button>
          </article>
        ) : null}

        {post ? (
          <section className="mt-4 space-y-3">
            <h2 className="text-sm font-semibold">댓글 {post.comments.length}</h2>
            {post.comments.length === 0 ? <p className="text-sm text-muted">아직 댓글이 없습니다.</p> : null}
            <ul className="space-y-2">
              {post.comments.map((comment) => (
                <li key={comment.id} className="rounded-2xl border border-line bg-surface px-4 py-3">
                  <p className="text-xs text-muted">
                    {comment.author} · {boardTime(comment.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p>
                  {commentDelete === comment.id ? (
                    <form onSubmit={onDeleteComment} className="mt-2 flex gap-2">
                      <input
                        type="password"
                        value={commentPassword}
                        onChange={(event) => setCommentPassword(event.target.value)}
                        placeholder="댓글 비밀번호"
                        className="h-10 flex-1 rounded-xl border border-outline px-3 text-sm"
                      />
                      <button type="submit" className="h-10 rounded-full bg-danger px-3 text-xs font-semibold text-on-primary">
                        삭제
                      </button>
                    </form>
                  ) : (
                    <button type="button" onClick={() => setCommentDelete(comment.id)} className="mt-2 text-xs text-muted underline">
                      삭제
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <form onSubmit={onComment} className="space-y-2 rounded-2xl border border-line bg-surface p-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                  placeholder="닉네임"
                  maxLength={16}
                  className="h-11 rounded-xl border border-outline px-3 text-sm"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호"
                  maxLength={32}
                  className="h-11 rounded-xl border border-outline px-3 text-sm"
                />
              </div>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="댓글"
                maxLength={500}
                rows={3}
                className="w-full rounded-xl border border-outline px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-60"
              >
                댓글 등록
              </button>
            </form>

            <form onSubmit={onDeletePost} className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-sm font-medium">글 삭제</p>
              <p className="mt-1 text-xs text-muted">글을 쓸 때 넣은 비밀번호가 맞아야 지워집니다.</p>
              <div className="mt-2 flex gap-2">
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  placeholder="글 비밀번호"
                  className="h-11 flex-1 rounded-xl border border-outline px-3 text-sm"
                />
                <button type="submit" className="h-11 rounded-full border border-danger px-4 text-sm font-semibold text-danger">
                  삭제
                </button>
              </div>
            </form>

            {actionError ? (
              <p role="alert" className="text-sm text-danger">
                {actionError}
              </p>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
