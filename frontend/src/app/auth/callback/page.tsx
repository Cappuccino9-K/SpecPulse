"use client";

import { useEffect, useState } from "react";
import { persistToken } from "@/lib/session";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("로그인을 마치는 중입니다.");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = (query.get("token") || hash.get("token") || "").trim();
    if (token.split(".").length < 3) {
      setMessage("로그인 토큰을 받지 못했습니다.");
      return;
    }
    persistToken(token);
    window.location.replace("/gallery");
  }, []);

  return <p className="p-6 text-sm text-muted">{message}</p>;
}
