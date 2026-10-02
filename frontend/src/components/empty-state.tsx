import { Cpu, Laptop, Tablet } from "lucide-react";

export function EmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-outline bg-surface/70 px-6 py-12 text-center">
      <div className="mx-auto flex items-center justify-center gap-3 text-primary">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary-container text-on-primary-container">
          <Laptop className="size-5" />
        </span>
        <span className="grid size-12 place-items-center rounded-2xl bg-surface-container text-muted">
          <Tablet className="size-5" />
        </span>
        <span className="grid size-12 place-items-center rounded-2xl bg-surface-container text-muted">
          <Cpu className="size-5" />
        </span>
      </div>
      <h2 className="mt-5 text-lg font-semibold tracking-tight">비교할 두 페이지를 올려 주세요</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">
        노트북, 태블릿, 그래픽카드 상세 페이지 주소를 넣으면 스펙 표를 나란히 맞추고, 리뷰에서 장점·아쉬운 점·추천 대상을 가려 구매 가이드를 만듭니다.
        샘플 칩을 누르면 데모 페이지로 바로 채워집니다.
      </p>
    </section>
  );
}
