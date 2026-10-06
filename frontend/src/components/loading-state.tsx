import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["페이지 렌더링 중...", "리뷰 노이즈 제거 중...", "AI 스펙 구조화 중...", "종합 구매 가이드 작성 중..."];

export function LoadingState({ step }: { step: number }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 elev-1" aria-live="polite">
      <div className="h-1 overflow-hidden rounded-full bg-primary-container">
        <div className="indeterminate h-full w-1/3 rounded-full bg-primary" />
      </div>
      <ol className="mt-5 space-y-4">
        {STEPS.map((title, index) => {
          const done = index < step;
          const active = index === step;
          return (
            <li key={title} className="flex items-center gap-3">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  done && "bg-success text-on-success",
                  active && "bg-primary text-on-primary",
                  !done && !active && "bg-surface-container text-muted",
                )}
              >
                {done ? <Check className="size-3.5" /> : index + 1}
              </span>
              <p className={cn("text-sm font-semibold", !active && !done && "text-muted")}>{title}</p>
            </li>
          );
        })}
      </ol>
      <div className="mt-6 space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-11 animate-pulse rounded-xl bg-surface-container"
            style={{ opacity: 1 - index * 0.12 }}
          />
        ))}
      </div>
    </section>
  );
}
