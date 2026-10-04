"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { fetchAuthConfig } from "@/lib/gallery";

export function LoginScreen({ error }: { error?: string }) {
  const [loginUrl, setLoginUrl] = useState("");
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [message, setMessage] = useState(error ?? "");

  useEffect(() => {
    fetchAuthConfig()
      .then((config) => {
        setEnabled(config.googleEnabled);
        setLoginUrl(config.loginUrl);
      })
      .catch((reason: unknown) => {
        setEnabled(false);
        setMessage(reason instanceof Error ? reason.message : "로그인 설정을 불러오지 못했습니다.");
      });
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">로그인</h1>
        <p className="text-sm leading-6 text-muted">
          글과 댓글은 로그인 없이 닉네임과 글 비밀번호로 남깁니다. 구글 로그인은 마이너갤 개설 권한에만 쓰입니다. 처음 로그인한 계정이 어드민이 됩니다.
        </p>
        {message ? (
          <p role="alert" className="rounded-2xl border border-danger/30 bg-danger-container px-4 py-3 text-sm text-on-danger-container">
            {message}
          </p>
        ) : null}
        {enabled ? (
          <a href={loginUrl} className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary">
            Google로 로그인
          </a>
        ) : null}
        {enabled === false ? (
          <p className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-muted">
            구글 클라이언트가 아직 연결되지 않았습니다. `gallery-service/google-oauth.json`에 웹 애플리케이션 클라이언트 JSON을 두고 `start.bat`을 다시 실행하세요.
          </p>
        ) : null}
        <Link href="/gallery" className="text-sm text-primary">
          갤러리로 돌아가기
        </Link>
      </main>
    </div>
  );
}
