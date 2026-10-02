import { Cpu, HardDrive, Laptop, MemoryStick, Monitor, Tablet } from "lucide-react";

const DEVICES = [
  { label: "CPU", icon: Cpu },
  { label: "메모리", icon: MemoryStick },
  { label: "SSD", icon: HardDrive },
  { label: "모니터", icon: Monitor },
  { label: "노트북", icon: Laptop },
  { label: "태블릿", icon: Tablet },
];

export function EmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-outline bg-surface/70 px-6 py-12 text-center">
      <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-2">
        {DEVICES.map((device, index) => {
          const Icon = device.icon;
          return (
            <span
              key={device.label}
              className={
                index === 0
                  ? "inline-flex h-10 items-center gap-2 rounded-2xl bg-primary-container px-3 text-sm font-semibold text-on-primary-container"
                  : "inline-flex h-10 items-center gap-2 rounded-2xl bg-surface-container px-3 text-sm font-medium text-muted"
              }
            >
              <Icon className="size-4" />
              {device.label}
            </span>
          );
        })}
      </div>
      <h2 className="mt-5 text-lg font-semibold tracking-tight">비교할 두 페이지를 올려 주세요</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">
        다나와, 컴퓨존처럼 스펙이 적힌 상품 주소면 부품 종류를 가리지 않습니다. 클럭, 코어, 용량, 전력처럼 같은 항목을 나란히 맞추고, 리뷰에서 장점과 추천 대상을 가려 구매 가이드를 만듭니다.
        위의 샘플은 데모 페이지를 채우는 예시입니다.
      </p>
    </section>
  );
}
