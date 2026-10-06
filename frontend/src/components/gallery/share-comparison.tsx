"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPost, fetchGalleries } from "@/lib/gallery";
import { cn } from "@/lib/utils";
import type { CompareResponse } from "@/types/analysis";
import type { GalleryCard } from "@/types/gallery";

const CATEGORY_SLUG: Record<string, string> = {
  CPU: "cpu",
  그래픽카드: "gpu",
  노트북: "notebook",
  태블릿: "notebook",
  메모리: "ram",
};

function draftTitle(result: CompareResponse) {
  const left = result.products[0]?.spec.name ?? "제품 A";
  const right = result.products[1]?.spec.name ?? "제품 B";
  return `${left} vs ${right}`.slice(0, 80);
}

function draftBody(result: CompareResponse) {
  const lines: string[] = [];
  if (result.guide.headline) lines.push(result.guide.headline);
  if (result.guide.value_note) {
    if (lines.length) lines.push("");
    lines.push(result.guide.value_note);
  }
  const notes = result.spec_rows.filter((row) => row.winner_index != null && row.note);
  if (notes.length) {
    lines.push("");
    for (const row of notes) lines.push(`- ${row.label}: ${row.note}`);
  }
  if (result.guide.picks.length) {
    lines.push("");
    for (const pick of result.guide.picks) lines.push(`- ${pick}`);
  }
  if (result.guide.caveat) {
    lines.push("");
    lines.push(result.guide.caveat);
  }
  const text = lines.join("\n").trim();
  return (text || "비교 결과를 남겨 주세요.").slice(0, 4000);
}

function preferredSlug(result: CompareResponse, galleries: GalleryCard[]) {
  const mapped = result.products
    .map((product) => CATEGORY_SLUG[product.spec.category])
    .filter((slug): slug is string => Boolean(slug));
  return mapped.find((slug) => galleries.some((gallery) => gallery.slug === slug)) ?? galleries[0]?.slug ?? "";
}

export function ShareComparison({ result }: { result: CompareResponse }) {
  const comparisonId = result.id;
  const [galleries, setGalleries] = useState<GalleryCard[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [slug, setSlug] = useState("");
  const [author, setAuthor] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState(() => draftTitle(result));
  const [body, setBody] = useState(() => draftBody(result));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [posted, setPosted] = useState<{ slug: string; id: number; name: string } | null>(null);

  useEffect(() => {
    if (!comparisonId) return;
    let cancelled = false;
    fetchGalleries()
      .then((items) => {
        if (cancelled) return;
        setGalleries(items);
        setSlug((current) => current || preferredSlug(result, items));
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setLoadError(reason instanceof Error ? reason.message : "갤러리 목록을 불러오지 못했습니다.");
      });
    return () => {
      cancelled = true;
    };
  }, [comparisonId, result]);

  const galleryName = useMemo(() => galleries?.find((item) => item.slug === slug)?.name ?? "마이너갤", [galleries, slug]);

  if (!comparisonId) return null;
  const savedId = comparisonId;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!slug) return;
    setPending(true);
    setError("");
    try {
      const created = await createPost(slug, { author, password, title, body, comparisonId: savedId });
      const name = galleries?.find((item) => item.slug === slug)?.name ?? galleryName;
      setPosted({ slug, id: created.id, name });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "비교 글을 올리지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rise overflow-hidden rounded-2xl border border-line bg-surface elev-1">
      <div className="border-l-4 border-primary px-5 py-5 sm:px-6">
        <h2 className="text-sm font-semibold">{galleryName}에 이 비교 남기기</h2>

        {loadError ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {loadError}
          </p>
        ) : null}

        {posted ? (
          <p className="mt-4 text-sm">
            올렸습니다.{" "}
            <Link href={`/gallery/${posted.slug}/${posted.id}`} className="font-semibold text-primary">
              {posted.name}에서 보기
            </Link>
          </p>
        ) : galleries && galleries.length === 0 ? (
          <p className="mt-3 text-sm text-muted">열린 갤러리가 없어 아직 올릴 곳이 없습니다.</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">갤러리</span>
              <select
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                disabled={!galleries}
                className="h-11 w-full rounded-xl border border-outline bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              >
                {!galleries ? <option value="">갤러리를 불러오는 중</option> : null}
                {galleries?.map((gallery) => (
                  <option key={gallery.slug} value={gallery.slug}>
                    {gallery.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">닉네임</span>
                <input
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                  maxLength={16}
                  autoComplete="nickname"
                  className="h-11 w-full rounded-xl border border-outline bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">글 비밀번호</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  maxLength={32}
                  autoComplete="new-password"
                  className="h-11 w-full rounded-xl border border-outline bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">제목</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={80}
                className="h-11 w-full rounded-xl border border-outline bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">본문</span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={4000}
                rows={8}
                className="w-full rounded-xl border border-outline bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </label>
            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending || !slug}
              className={cn(
                "inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-60",
              )}
            >
              {pending ? "올리는 중" : "비교 글 등록"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
