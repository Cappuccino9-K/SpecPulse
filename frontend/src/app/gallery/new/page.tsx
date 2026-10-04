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
        <p className="mt-1 text-sm text-muted">
          {staff
            ? "모더레이터와 어드민은 요청 없이 갤러리를 바로 엽니다."
            : "사용자 요청은 모더레이터 또는 어드민이 승인한 뒤에 갤러리가 열립니다."}
        </p>
        {!ready ? <p className="mt-4 text-sm text-muted">로그인 상태를 확인하는 중입니다.</p> : null}
        {ready && !session ? (
          <p className="mt-4 text-sm text-muted">
            <Link href="/login" className="text-primary">
              로그인
            </Link>
            한 뒤에 요청할 수 있습니다. 글과 댓글은 로그인 없이도 쓸 수 있습니다.
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
