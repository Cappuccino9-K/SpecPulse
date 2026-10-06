"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { openGallery, requestGallery } from "@/lib/gallery";
import type { GalleryRole } from "@/types/account";

export function GalleryDraftForm({ role }: { role: GalleryRole }) {
  const router = useRouter();
  const staff = role === "ADMIN" || role === "MODERATOR";
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      if (staff) {
        const created = await openGallery({ name, slug, description });
        router.push(`/gallery/${created.slug}`);
        return;
      }
      await requestGallery({ name, slug, description });
      router.push("/gallery/requests");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "요청을 보내지 못했습니다.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-line bg-surface p-4 elev-1 sm:p-6">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">이름</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
          placeholder="파워서플라이 마이너갤"
          className="h-12 w-full rounded-xl border border-outline bg-surface px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">주소</span>
        <input
          value={slug}
          onChange={(event) => setSlug(event.target.value.toLowerCase())}
          maxLength={40}
          placeholder="psu"
          className="h-12 w-full rounded-xl border border-outline bg-surface px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">설명</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={200}
          rows={4}
          className="w-full rounded-xl border border-outline bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-60"
        >
          {pending ? "처리 중" : staff ? "갤러리 만들기" : "개설 요청"}
        </button>
        <Link href="/gallery" className="inline-flex h-11 items-center rounded-full border border-line px-5 text-sm">
          취소
        </Link>
      </div>
    </form>
  );
}
