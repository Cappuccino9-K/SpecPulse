"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-6">
      <p className="text-sm font-semibold text-primary">SpecPulse</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">화면을 그리지 못했습니다</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{error.message || "예상하지 못한 오류가 발생했습니다."}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-11 w-fit items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary"
      >
        다시 시도
      </button>
    </main>
  );
}
