"use client";

import { Trash2 } from "lucide-react";
import { cn, formatWhen } from "@/lib/utils";
import type { HistoryItem } from "@/types/analysis";

const PROVIDER_LABEL: Record<HistoryItem["provider"], string> = {
  local: "로컬",
  openai: "OpenAI",
  ollama: "Ollama",
};

export function HistoryRail({
  items,
  activeId,
  onOpen,
  onDelete,
}: {
  items: HistoryItem[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className="order-2 lg:order-1">
      <div className="lg:sticky lg:top-24">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">최근 비교</h2>
          <span className="text-xs text-muted">{items.length}건</span>
        </div>
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-outline px-4 py-6 text-sm leading-6 text-muted">
            아직 없습니다.
          </p>
        ) : (
          <ul className="flex gap-3 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
            {items.map((item) => (
              <li key={item.id} className="min-w-[240px] lg:min-w-0">
                <div
                  className={cn(
                    "group flex items-start gap-2 rounded-2xl border bg-surface p-3 transition hover:border-primary/40",
                    activeId === item.id ? "border-primary" : "border-line",
                  )}
                >
                  <button type="button" onClick={() => onOpen(item.id)} className="min-w-0 flex-1 text-left">
                    <p className="line-clamp-2 text-sm font-medium leading-5">{item.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {formatWhen(item.created_at)} · {PROVIDER_LABEL[item.provider]}
                    </p>
                  </button>
                  <button
                    type="button"
                    aria-label={`${item.title} 기록 삭제`}
                    onClick={() => onDelete(item.id)}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-danger-container hover:text-danger"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
