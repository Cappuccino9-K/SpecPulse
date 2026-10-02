import { Cpu, ExternalLink, Laptop, Tablet } from "lucide-react";
import { cn, demoSlug } from "@/lib/utils";
import type { CompareResponse } from "@/types/analysis";

export function SpecCompareTable({ result }: { result: CompareResponse }) {
  const [first, second] = result.products;
  return (
    <section className="rise rounded-2xl border border-line bg-surface elev-1">
      <div className="flex items-end justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight">핵심 스펙 비교</h2>
          <p className="mt-1 text-xs text-muted">페이지에서 읽은 스펙을 같은 항목끼리 맞춥니다. 초록 칸은 수치 우위입니다.</p>
        </div>
      </div>

      <div className="hidden md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="w-[18%] px-5 py-4 text-xs font-medium text-muted">항목</th>
              {[first, second].map((product, index) => (
                <th key={product.spec.url ?? product.spec.name} className="px-4 py-4 align-top font-normal">
                  <ProductHeading product={product} index={index} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.spec_rows.map((row) => (
              <tr key={row.key} className="border-b border-line last:border-0">
                <th className="px-5 py-3.5 text-left text-xs font-medium text-muted">{row.label}</th>
                {row.values.map((value, index) => {
                  const winner = row.winner_index === index;
                  return (
                    <td
                      key={`${row.key}-${index}`}
                      className={cn("px-4 py-3.5 align-top", winner && "bg-success-container/80")}
                    >
                      <ValueCell value={value} winner={winner} note={winner ? row.note : null} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        <div className="grid grid-cols-2 gap-2">
          {[first, second].map((product, index) => (
            <ProductHeading key={product.spec.name} product={product} index={index} compact />
          ))}
        </div>
        {result.spec_rows.map((row) => (
          <article key={row.key} className="rounded-xl border border-line p-3">
            <h3 className="text-xs font-medium text-muted">{row.label}</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {row.values.map((value, index) => {
                const winner = row.winner_index === index;
                return (
                  <div key={`${row.key}-${index}`} className={cn("rounded-lg p-2", winner && "bg-success-container")}>
                    <ValueCell value={value} winner={winner} note={winner ? row.note : null} />
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductHeading({
  product,
  index,
  compact = false,
}: {
  product: CompareResponse["products"][number];
  index: number;
  compact?: boolean;
}) {
  const slug = demoSlug(product.spec.url);
  const Icon = categoryIcon(product.spec.category);
  return (
    <div className="flex gap-3">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold",
          index === 0 ? "bg-primary text-on-primary" : "bg-tertiary text-on-tertiary",
        )}
      >
        {product.spec.brand.slice(0, 1)}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
          <Icon className="size-3.5" />
          {product.spec.category}
        </div>
        <p className={cn("font-semibold leading-5", compact ? "line-clamp-2 text-sm" : "text-base")}>
          {product.spec.name}
        </p>
        <p className="mt-0.5 text-xs text-muted">{product.spec.price ?? "가격 정보 없음"}</p>
        {slug || product.spec.url ? (
          <a
            href={slug ? `/demo/products/${slug}` : product.spec.url ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary"
          >
            원문 페이지
            <ExternalLink className="size-3" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

function ValueCell({ value, winner, note }: { value: string; winner: boolean; note: string | null }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <p className="leading-6">{value || "—"}</p>
        {winner ? (
          <span className="shrink-0 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-on-success">우위</span>
        ) : null}
      </div>
      {note ? <p className="mt-1 text-[11px] font-medium text-success">{note}</p> : null}
    </div>
  );
}

function categoryIcon(category: string) {
  if (category.includes("태블릿")) return Tablet;
  if (category.includes("그래픽")) return Cpu;
  return Laptop;
}
