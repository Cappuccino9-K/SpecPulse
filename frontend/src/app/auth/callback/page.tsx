"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { notifySession, TOKEN_KEY } from "@/lib/session";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("로그인을 마치는 중입니다.");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = hash.get("token");
    if (!token) {
      setMessage("로그인 토큰을 받지 못했습니다.");
      return;
    }
    localStorage.setItem(TOKEN_KEY, token.trim());
    notifySession();
    router.replace("/gallery");
  }, [router]);

  return <p className="p-6 text-sm text-muted">{message}</p>;
}
