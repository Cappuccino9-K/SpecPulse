import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function validateUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "주소를 입력해 주세요.";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "http 또는 https 주소만 사용할 수 있습니다.";
    }
    return null;
  } catch {
    return "올바른 URL 형식이 아닙니다.";
  }
}

export function demoSlug(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "demo.specpulse.app") {
      const slug = parsed.pathname.replace(/^\/+|\/+$/g, "");
      return slug || null;
    }
    const match = parsed.pathname.match(/^\/demo\/products\/([a-z0-9-]+)$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(date);
}

export function engineLabel(source: string, extractor: string): string {
  if (extractor === "crawl4ai" && source === "openai") return "Crawl4AI · GPT-4o mini";
  if (extractor === "crawl4ai" && source === "ollama") return "Crawl4AI · Ollama";
  if (source === "openai") return "GPT-4o mini";
  if (source === "ollama") return "Ollama";
  return "로컬 파서";
}
