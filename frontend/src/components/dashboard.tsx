"use client";

import { Activity } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { compareProducts, deleteComparison, fetchComparison, fetchHistory } from "@/lib/api";
import { validateUrl } from "@/lib/utils";
import type { CompareResponse, HistoryItem, Provider } from "@/types/analysis";
import { BuyingGuide } from "@/components/buying-guide";
import { EmptyState } from "@/components/empty-state";
import { HistoryRail } from "@/components/history-rail";
import { LoadingState } from "@/components/loading-state";
import { SentimentCards } from "@/components/sentiment-cards";
import { SpecCompareTable } from "@/components/spec-compare-table";
import { ThemeToggle } from "@/components/theme-toggle";
import { UrlInputForm } from "@/components/url-input-form";

const SAMPLE_PAIRS: Record<string, [string, string]> = {
  laptops: ["https://demo.specpulse.app/macbook-air-m3", "https://demo.specpulse.app/galaxy-book4-pro"],
  tablets: ["https://demo.specpulse.app/ipad-pro-13-m4", "https://demo.specpulse.app/galaxy-tab-s9-ultra"],
  gpus: ["https://demo.specpulse.app/rtx-4070-super", "https://demo.specpulse.app/rx-7800-xt"],
};

export function Dashboard() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [provider, setProvider] = useState<Provider>("local");
  const [errors, setErrors] = useState<{ left?: string; right?: string }>({});
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const sampleStarted = useRef(false);

  useEffect(() => {
    fetchHistory()
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    if (status !== "loading") return;
    setStep(0);
    const timers = [350, 750, 1150].map((delay, index) => window.setTimeout(() => setStep(index + 1), delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [status]);

  async function refreshHistory() {
    try {
      setHistory(await fetchHistory());
    } catch {
      setHistory([]);
    }
  }

  async function submitPair(nextLeft: string, nextRight: string, nextProvider: Provider = provider) {
    const leftError = validateUrl(nextLeft);
    const rightError = validateUrl(nextRight);
    const same = !leftError && !rightError && nextLeft.trim().replace(/\/$/, "") === nextRight.trim().replace(/\/$/, "");
    setErrors({
      left: leftError ?? undefined,
      right: rightError ?? (same ? "서로 다른 제품 주소를 입력해 주세요." : undefined),
    });
    if (leftError || rightError || same) return;

    setStatus("loading");
    setMessage("");
    const started = performance.now();
    try {
      const next = await compareProducts([nextLeft.trim(), nextRight.trim()], nextProvider);
      const remaining = 1500 - (performance.now() - started);
      if (remaining > 0) await new Promise((resolve) => window.setTimeout(resolve, remaining));
      setResult(next);
      setStatus("ready");
      await refreshHistory();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "분석을 끝내지 못했습니다.");
    }
  }

  useEffect(() => {
    if (sampleStarted.current) return;
    const sample = new URLSearchParams(window.location.search).get("sample");
    const pair = sample ? SAMPLE_PAIRS[sample] : undefined;
    if (!pair) return;
    sampleStarted.current = true;
    setLeft(pair[0]);
    setRight(pair[1]);
    void submitPair(pair[0], pair[1], "local");
    // Preset query runs once on load; submitPair closes over the initial provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit() {
    await submitPair(left, right);
  }

  async function openHistory(id: string) {
    setMessage("");
    try {
      const next = await fetchComparison(id);
      setResult(next);
      setLeft(next.products[0]?.spec.url ?? "");
      setRight(next.products[1]?.spec.url ?? "");
      setProvider(next.provider);
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "기록을 열지 못했습니다.");
    }
  }

  async function removeHistory(id: string) {
    try {
      await deleteComparison(id);
      setHistory((current) => current.filter((item) => item.id !== id));
      if (result?.id === id) {
        setResult(null);
        setStatus("idle");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "기록을 지우지 못했습니다.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-on-primary">
              <Activity className="size-5" />
            </span>
            <div>
              <p className="text-base font-bold tracking-tight">SpecPulse</p>
              <p className="hidden text-xs text-muted sm:block">스펙은 나란히, 리뷰의 온도까지</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <HistoryRail items={history} activeId={result?.id ?? null} onOpen={openHistory} onDelete={removeHistory} />
        <main className="order-1 min-w-0 space-y-5 lg:order-2">
          <UrlInputForm
            left={left}
            right={right}
            provider={provider}
            loading={status === "loading"}
            errors={errors}
            onLeft={setLeft}
            onRight={setRight}
            onProvider={setProvider}
            onPreset={([nextLeft, nextRight]) => {
              setLeft(nextLeft);
              setRight(nextRight);
              setErrors({});
            }}
            onSubmit={onSubmit}
          />

          {status === "error" && message ? (
            <div role="alert" className="rounded-2xl border border-danger/30 bg-danger-container px-4 py-3 text-sm text-on-danger-container">
              {message}
            </div>
          ) : null}

          {status === "loading" ? <LoadingState step={step} /> : null}
          {status !== "loading" && !result ? <EmptyState /> : null}
          {status !== "loading" && result ? (
            <>
              <SpecCompareTable result={result} />
              <SentimentCards products={result.products} />
              <BuyingGuide result={result} />
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
