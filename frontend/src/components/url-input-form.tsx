"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchPresets } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Preset, Provider } from "@/types/analysis";

const FALLBACK_PRESETS: Preset[] = [
  {
    id: "laptops",
    label: "노트북",
    category: "노트북",
    urls: ["https://demo.specpulse.app/macbook-air-m3", "https://demo.specpulse.app/galaxy-book4-pro"],
  },
  {
    id: "tablets",
    label: "태블릿",
    category: "태블릿",
    urls: ["https://demo.specpulse.app/ipad-pro-13-m4", "https://demo.specpulse.app/galaxy-tab-s9-ultra"],
  },
  {
    id: "gpus",
    label: "그래픽카드",
    category: "그래픽카드",
    urls: ["https://demo.specpulse.app/rtx-4070-super", "https://demo.specpulse.app/rx-7800-xt"],
  },
];

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "local", label: "로컬" },
  { id: "openai", label: "OpenAI" },
  { id: "ollama", label: "Ollama" },
];

type Props = {
  left: string;
  right: string;
  provider: Provider;
  loading: boolean;
  errors: { left?: string; right?: string };
  onLeft: (value: string) => void;
  onRight: (value: string) => void;
  onProvider: (provider: Provider) => void;
  onPreset: (urls: [string, string]) => void;
  onSubmit: () => void;
};

export function UrlInputForm({
  left,
  right,
  provider,
  loading,
  errors,
  onLeft,
  onRight,
  onProvider,
  onPreset,
  onSubmit,
}: Props) {
  const [presets, setPresets] = useState<Preset[]>(FALLBACK_PRESETS);

  useEffect(() => {
    fetchPresets()
      .then((items) => {
        if (items.length) setPresets(items);
      })
      .catch(() => setPresets(FALLBACK_PRESETS));
  }, []);

  return (
    <form
      className="rounded-2xl border border-line bg-surface p-4 elev-2 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">비교할 제품 페이지</h2>
        </div>
        <div className="mt-3 inline-flex rounded-full bg-surface-container p-1 sm:mt-0" role="radiogroup" aria-label="분석 엔진">
          {PROVIDERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={provider === item.id}
              onClick={() => onProvider(item.id)}
              className={cn(
                "h-8 rounded-full px-3 text-xs font-semibold transition",
                provider === item.id ? "bg-surface text-primary elev-1" : "text-muted hover:text-on-surface",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <OutlinedField
          label="제품 A"
          value={left}
          placeholder="https://쇼핑몰/제품-상세-주소"
          error={errors.left}
          onChange={onLeft}
        />
        <div className="mx-auto grid size-10 place-items-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container md:mt-7">
          VS
        </div>
        <OutlinedField
          label="제품 B"
          value={right}
          placeholder="https://쇼핑몰/비교할-제품-주소"
          error={errors.right}
          onChange={onRight}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2" aria-label="샘플 비교">
          <span className="text-xs font-medium text-muted">샘플</span>
          {presets.map((preset) => {
            const selected = left === preset.urls[0] && right === preset.urls[1];
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onPreset([preset.urls[0], preset.urls[1]])}
                className={cn(
                  "h-8 rounded-full border px-3 text-xs font-semibold transition",
                  selected
                    ? "border-transparent bg-primary-container text-on-primary-container"
                    : "border-outline bg-surface text-muted hover:border-primary hover:text-on-surface",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-on-primary elev-1 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
        >
          <Sparkles className="size-4" />
          AI 스펙 비교 및 리뷰 분석
        </button>
      </div>
    </form>
  );
}

function OutlinedField({
  label,
  value,
  placeholder,
  error,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode="url"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-14 w-full rounded-xl border bg-surface px-4 text-sm text-on-surface outline-none transition placeholder:text-muted/60 focus:ring-4",
          error ? "border-danger focus:border-danger focus:ring-danger/15" : "border-outline focus:border-primary focus:ring-primary/15",
        )}
      />
      {error ? <span className="mt-1.5 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}
