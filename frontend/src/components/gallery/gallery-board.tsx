"use client";

import { ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { boardTime, fetchPosts } from "@/lib/gallery";
import type { PostPage } from "@/types/gallery";

export function GalleryBoard({ slug }: { slug: string }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PostPage | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchPosts(slug, page)
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setData(null);
          setError(reason instanceof Error ? reason.message : "글 목록을 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link href="/gallery" className="text-xs font-medium text-primary">
              마이너갤
            </Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{data?.gallery.name ?? "갤러리"}</h1>
            {data ? <p className="mt-1 text-sm text-muted">{data.gallery.description}</p> : null}
          </div>
          <Link
            href={`/gallery/${slug}/write`}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary"
          >
            <PenLine className="size-4" />
            글쓰기
          </Link>
        </div>

        {error ? (
          <p role="alert" className="rounded-2xl border border-danger/30 bg-danger-container px-4 py-3 text-sm text-on-danger-container">
            {error}
          </p>
        ) : null}

        {loading && !data ? <p className="text-sm text-muted">글을 불러오는 중입니다.</p> : null}

        {data && data.posts.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface px-4 py-12 text-center">
            <p className="text-sm text-muted">아직 글이 없습니다. 첫 글을 남겨 보세요.</p>
          </div>
        ) : null}

        {data && data.posts.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container text-xs text-muted">
                  <tr>
                    <th className="w-16 px-3 py-2 font-medium">번호</th>
                    <th className="px-3 py-2 font-medium">제목</th>
                    <th className="w-28 px-3 py-2 font-medium">글쓴이</th>
                    <th className="w-20 px-3 py-2 font-medium">날짜</th>
                    <th className="w-16 px-3 py-2 text-right font-medium">조회</th>
                    <th className="w-16 px-3 py-2 text-right font-medium">추천</th>
                  </tr>
                </thead>
                <tbody>
                  {data.posts.map((post) => (
                    <tr key={post.id} className="border-t border-line">
                      <td className="px-3 py-2.5 text-muted">{post.id}</td>
                      <td className="px-3 py-2.5">
                        <Link href={`/gallery/${slug}/${post.id}`} className="font-medium hover:text-primary">
                          {post.title}
                          {post.commentCount > 0 ? <span className="ml-1 text-primary">[{post.commentCount}]</span> : null}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-muted">{post.author}</td>
                      <td className="px-3 py-2.5 text-muted">{boardTime(post.createdAt)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted">{post.views}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{post.recommends}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-2 md:hidden">
              {data.posts.map((post) => (
                <li key={post.id}>
                  <Link href={`/gallery/${slug}/${post.id}`} className="block rounded-2xl border border-line bg-surface p-3">
                    <p className="font-medium">
                      {post.title}
                      {post.commentCount > 0 ? <span className="ml-1 text-primary">[{post.commentCount}]</span> : null}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {post.author} · {boardTime(post.createdAt)} · 조회 {post.views} · 추천 {post.recommends}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="grid size-10 place-items-center rounded-full border border-line bg-surface disabled:opacity-40"
                aria-label="이전 페이지"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm text-muted">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="grid size-10 place-items-center rounded-full border border-line bg-surface disabled:opacity-40"
                aria-label="다음 페이지"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
