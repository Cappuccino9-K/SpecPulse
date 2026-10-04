"use client";

import { MessagesSquare, PenLine, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { boardTime, fetchGalleries } from "@/lib/gallery";
import type { GalleryCard } from "@/types/gallery";

export function GalleryHome() {
  const { session, ready } = useAuth();
  const staff = session?.role === "ADMIN" || session?.role === "MODERATOR";
  const [items, setItems] = useState<GalleryCard[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGalleries()
      .then(setItems)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "갤러리 목록을 불러오지 못했습니다."));
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-wide text-primary">MINOR GALLERY</p>
          <h1 className="text-2xl font-bold tracking-tight">마이너갤러리</h1>
          <p className="max-w-2xl text-sm text-muted">
            글과 댓글은 닉네임과 글 비밀번호만으로 남깁니다. 갤러리를 새로 여는 일만 구글 로그인과 역할이 필요합니다.
          </p>
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          {session ? (
            <Link href="/gallery/new" className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary">
              <Plus className="size-4" />
              {staff ? "갤러리 만들기" : "개설 요청"}
            </Link>
          ) : ready ? (
            <Link href="/login" className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-medium">
              로그인하고 갤러리 요청
            </Link>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="rounded-2xl border border-danger/30 bg-danger-container px-4 py-3 text-sm text-on-danger-container">
            {error}
          </p>
        ) : null}

        {items === null && !error ? <p className="text-sm text-muted">갤러리를 불러오는 중입니다.</p> : null}

        {items && items.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted">아직 열린 갤러리가 없습니다.</p>
        ) : null}

        {items && items.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((gallery) => (
              <li key={gallery.slug}>
                <Link
                  href={`/gallery/${gallery.slug}`}
                  className="flex h-full flex-col rounded-2xl border border-line bg-surface p-4 elev-1 transition hover:border-primary"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">{gallery.name}</h2>
                      <p className="mt-1 text-sm text-muted">{gallery.description}</p>
                    </div>
                    <MessagesSquare className="size-5 shrink-0 text-primary" />
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3 text-xs text-muted">
                    <span>글 {gallery.postCount}</span>
                    <span className="min-w-0 truncate text-right">
                      {gallery.latestTitle ? `${gallery.latestTitle} · ${boardTime(gallery.latestAt)}` : "아직 글이 없습니다"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-6 inline-flex items-center gap-2 text-xs text-muted">
          <PenLine className="size-3.5" />
          갤러리 서비스는 Spring Boot로 따로 떠 있고, 스펙 비교 API와 화면만 나눕니다.
        </p>
      </main>
    </div>
  );
}
