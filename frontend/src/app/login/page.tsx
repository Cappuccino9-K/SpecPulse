"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LoginScreen } from "@/components/login-screen";

function LoginContent() {
  const params = useSearchParams();
  return <LoginScreen error={params.get("error") ?? undefined} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted">로그인 화면을 준비하는 중입니다.</p>}>
      <LoginContent />
    </Suspense>
  );
}
