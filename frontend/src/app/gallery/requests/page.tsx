"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/components/auth-provider";
import { approveRequest, boardTime, fetchMyRequests, fetchRequestQueue, rejectRequest } from "@/lib/gallery";
import type { GalleryRequestItem } from "@/types/account";

function statusLabel(status: GalleryRequestItem["status"]): string {
  if (status === "APPROVED") return "승인";
  if (status === "REJECTED") return "거절";
  return "대기";
}

export default function GalleryRequestsPage() {
  const { session, ready } = useAuth();
  const staff = session?.role === "ADMIN" || session?.role === "MODERATOR";
  const [items, setItems] = useState<GalleryRequestItem[] | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState<Record<number, string>>({});

  function load() {
    const task = staff ? fetchRequestQueue() : fetchMyRequests();
    task
      .then(setItems)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "요청을 불러오지 못했습니다."));
  }

  useEffect(() => {
    if (!ready || !session) return;
    load();
    // load depends on the current role after login.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session?.role]);

  async function approve(id: number) {
    setError("");
    try {
      await approveRequest(id);
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "승인하지 못했습니다.");
    }
  }

  async function reject(id: number) {
    setError("");
    try {
      await rejectRequest(id, note[id] ?? "");
      load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "거절하지 못했습니다.");
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Link href="/gallery" className="text-xs font-medium text-primary">
          마이너갤
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{staff ? "개설 요청" : "내 요청"}</h1>
        <p className="mt-1 text-sm text-muted">
          {staff ? "대기 중인 요청만 보입니다. 승인하면 갤러리가 바로 열립니다." : "요청 상태입니다. 글쓰기는 승인과 관계없이 열린 갤러리에서 할 수 있습니다."}
        </p>
        {ready && !session ? (
          <p className="mt-4 text-sm">
            <Link href="/login" className="text-primary">
              로그인
            </Link>
            이 필요합니다.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-4 rounded-2xl border border-danger/30 bg-danger-container px-4 py-3 text-sm text-on-danger-container">
            {error}
          </p>
        ) : null}
        {items && items.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{staff ? "대기 중인 요청이 없습니다." : "아직 요청이 없습니다."}</p>
        ) : null}
        <ul className="mt-4 space-y-3">
          {items?.map((item) => (
            <li key={item.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-bold">{item.name}</h2>
                  <p className="text-xs text-muted">
                    /gallery/{item.slug} · {item.requesterName} · {boardTime(item.createdAt)}
                  </p>
                </div>
                <span className="rounded-full bg-surface-container px-2 py-1 text-xs">{statusLabel(item.status)}</span>
              </div>
              <p className="mt-2 text-sm text-muted">{item.description}</p>
              {staff && item.status === "PENDING" ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={() => approve(item.id)} className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary">
                    승인
                  </button>
                  <input
                    value={note[item.id] ?? ""}
                    onChange={(event) => setNote((current) => ({ ...current, [item.id]: event.target.value }))}
                    placeholder="거절 이유, 선택"
                    maxLength={200}
                    className="h-10 min-w-0 flex-1 rounded-xl border border-outline px-3 text-sm"
                  />
                  <button type="button" onClick={() => reject(item.id)} className="h-10 rounded-full border border-danger px-4 text-sm font-semibold text-danger">
                    거절
                  </button>
                </div>
              ) : null}
              {item.reviewNote ? <p className="mt-2 text-xs text-muted">사유: {item.reviewNote}</p> : null}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
