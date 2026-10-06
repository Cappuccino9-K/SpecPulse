import { Sparkles } from "lucide-react";
import type { CompareResponse } from "@/types/analysis";

export function BuyingGuide({ result }: { result: CompareResponse }) {
  return (
    <section className="rise overflow-hidden rounded-2xl border border-line bg-surface elev-1">
      <div className="border-l-4 border-primary px-5 py-5 sm:px-6">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="size-4" />
          <h2 className="text-sm font-semibold">AI 종합 구매 가이드</h2>
        </div>
        <p className="mt-3 text-lg font-semibold leading-7 tracking-tight">{result.guide.headline}</p>
        <p className="mt-3 rounded-xl bg-primary-container/60 px-4 py-3 text-sm leading-6 text-on-primary-container">
          {result.guide.value_note}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {result.guide.picks.map((pick, index) => (
            <p key={pick} className="rounded-xl bg-surface-container px-4 py-3 text-sm leading-6">
              <span className="mb-1 block text-[11px] font-semibold text-muted">{index === 0 ? "제품 A" : "제품 B"}</span>
              {pick}
            </p>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted">{result.guide.caveat}</p>
      </div>
    </section>
  );
}
