"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { createPost } from "@/lib/gallery";
import { cn } from "@/lib/utils";

export function WritePost({ slug }: { slug: string }) {
  const router = useRouter();
  const [author, setAuthor] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const created = await createPost(slug, { author, password, title, body });
      router.push(`/gallery/${slug}/${created.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "글을 올리지 못했습니다.");
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Link href={`/gallery/${slug}`} className="text-xs font-medium text-primary">
          목록으로
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">글쓰기</h1>
        <p className="mt-1 text-sm text-muted">비밀번호는 글을 지울 때만 쓰입니다. 서버는 해시만 저장합니다.</p>
        <form onSubmit={onSubmit} className="mt-5 space-y-3 rounded-2xl border border-line bg-surface p-4 elev-1 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="닉네임" value={author} onChange={setAuthor} maxLength={16} autoComplete="nickname" />
            <Field label="비밀번호" value={password} onChange={setPassword} type="password" maxLength={32} autoComplete="new-password" />
          </div>
          <Field label="제목" value={title} onChange={setTitle} maxLength={80} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">본문</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={4000}
              rows={10}
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
            disabled={pending}
            className={cn(
              "inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-60",
            )}
          >
            {pending ? "올리는 중" : "등록"}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  maxLength?: number;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-outline bg-surface px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
      />
    </label>
  );
}
