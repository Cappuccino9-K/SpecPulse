"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchComparison } from "@/lib/api";
import type { CompareResponse } from "@/types/analysis";

export function ComparisonExcerpt({ comparisonId }: { comparisonId: string }) {
  const [data, setData] = useState<CompareResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");
    fetchComparison(comparisonId)
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch(() => {
        if (!cancelled) setError("저장된 비교를 다시 열지 못했습니다.");
      });
    return () => {
      cancelled = true;
    };
  }, [comparisonId]);

  const notes = data?.spec_rows.filter((row) => row.winner_index != null && row.note).slice(0, 4) ?? [];

  return (
    <aside className="mt-5 rounded-xl border border-line bg-surface-container px-4 py-3">
      <p className="text-[11px] font-semibold text-muted">스펙 비교</p>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {!data && !error ? <p className="mt-2 text-sm text-muted">비교를 불러오는 중입니다.</p> : null}
      {data ? (
        <>
          <p className="mt-2 text-sm font-semibold">
            {data.products[0]?.spec.name ?? "제품 A"} vs {data.products[1]?.spec.name ?? "제품 B"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {(data.products[0]?.spec.price || "가격 미확인") + " · " + (data.products[1]?.spec.price || "가격 미확인")}
          </p>
          {data.guide.headline ? <p className="mt-2 text-sm leading-6">{data.guide.headline}</p> : null}
          {data.guide.value_note ? <p className="mt-1 text-sm leading-6 text-muted">{data.guide.value_note}</p> : null}
          {notes.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm leading-6">
              {notes.map((row) => (
                <li key={row.key}>
                  - {row.label}: {row.note}
                </li>
              ))}
            </ul>
          ) : null}
          <Link href={`/compare?comparison=${encodeURIComponent(comparisonId)}`} className="mt-3 inline-block text-sm font-semibold text-primary">
            비교 화면에서 다시 보기
          </Link>
        </>
      ) : null}
    </aside>
  );
}
