import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "페이지 렌더링 중...", detail: "본문만 남기고 내비게이션, 광고, 푸터를 걷어냅니다." },
  { title: "리뷰 노이즈 제거 중...", detail: "스펙 표와 사용자 문장을 분리합니다." },
  { title: "AI 스펙 구조화 중...", detail: "클럭, 코어, 용량, 전력처럼 같은 항목끼리 맞춥니다." },
  { title: "종합 구매 가이드 작성 중...", detail: "가성비와 추천 대상을 한 단락으로 모읍니다." },
];

export function LoadingState({ step }: { step: number }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 elev-1" aria-live="polite">
      <div className="h-1 overflow-hidden rounded-full bg-primary-container">
        <div className="indeterminate h-full w-1/3 rounded-full bg-primary" />
      </div>
      <ol className="mt-5 space-y-4">
        {STEPS.map((item, index) => {
          const done = index < step;
          const active = index === step;
          return (
            <li key={item.title} className="flex gap-3">
              <span
                className={cn(
                  "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  done && "bg-success text-on-success",
                  active && "bg-primary text-on-primary",
                  !done && !active && "bg-surface-container text-muted",
                )}
              >
                {done ? <Check className="size-3.5" /> : index + 1}
              </span>
              <div>
                <p className={cn("text-sm font-semibold", !active && !done && "text-muted")}>{item.title}</p>
                <p className="text-xs leading-5 text-muted">{item.detail}</p>
              </div>
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
