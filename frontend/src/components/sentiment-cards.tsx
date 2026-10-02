import { AlertTriangle, Target, ThumbsUp } from "lucide-react";
import type { ReactNode } from "react";
import type { HardwareAnalysisResult } from "@/types/analysis";

export function SentimentCards({ products }: { products: HardwareAnalysisResult[] }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {products.map((product) => (
        <article key={product.spec.url ?? product.spec.name} className="rise rounded-2xl border border-line bg-surface p-5 elev-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted">실제 유저 반응 분석</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">{product.spec.name}</h2>
            </div>
            <ScoreRing score={product.reviews.sentiment_score} />
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">{product.reviews.overall}</p>
          <div className="mt-5 space-y-5">
            <PointBlock title="장점 Top 3" icon={<ThumbsUp className="size-3.5" />} tone="good" items={product.reviews.pros} />
            <PointBlock
              title="아쉬운 점 Top 3"
              icon={<AlertTriangle className="size-3.5" />}
              tone="bad"
              items={product.reviews.cons}
            />
            <PointBlock
              title="이런 사람에게 추천"
              icon={<Target className="size-3.5" />}
              tone="info"
              items={product.reviews.recommended_for}
            />
          </div>
        </article>
      ))}
    </section>
  );
}

function ScoreRing({ score }: { score: number }) {
  const degrees = Math.max(0, Math.min(100, score)) * 3.6;
  return (
    <div
      className="grid size-16 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(var(--primary) ${degrees}deg, var(--outline-variant) 0deg)` }}
      role="img"
      aria-label={`감성 점수 ${Math.round(score)}점`}
    >
      <div className="grid size-12 place-items-center rounded-full bg-surface text-sm font-bold">{Math.round(score)}</div>
    </div>
  );
}

function PointBlock({
  title,
  icon,
  tone,
  items,
}: {
  title: string;
  icon: ReactNode;
  tone: "good" | "bad" | "info";
  items: string[];
}) {
  const chip =
    tone === "good"
      ? "bg-success-container text-on-success-container"
      : tone === "bad"
        ? "bg-warning-container text-on-warning-container"
        : "bg-info-container text-on-info-container";
  return (
    <section>
      <h3 className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${chip}`}>
        {icon}
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">페이지에서 이 항목을 찾지 못했습니다.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={item} className="flex gap-2 text-sm leading-6">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-surface-container text-[11px] font-semibold text-muted">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
