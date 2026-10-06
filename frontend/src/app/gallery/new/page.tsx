"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { GalleryDraftForm } from "@/components/gallery/gallery-draft-form";
import { useAuth } from "@/components/auth-provider";

export default function NewGalleryPage() {
  const { session, ready } = useAuth();
  const staff = session?.role === "ADMIN" || session?.role === "MODERATOR";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Link href="/gallery" className="text-xs font-medium text-primary">
          마이너갤
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{staff ? "갤러리 만들기" : "갤러리 개설 요청"}</h1>
        {!ready ? <p className="mt-4 text-sm text-muted">로그인 상태를 확인하는 중입니다.</p> : null}
        {ready && !session ? (
          <p className="mt-4 text-sm text-muted">
            <Link href="/login" className="text-primary">
              로그인
            </Link>
            이 필요합니다.
          </p>
        ) : null}
        {session ? (
          <div className="mt-5">
            <GalleryDraftForm role={session.role} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
