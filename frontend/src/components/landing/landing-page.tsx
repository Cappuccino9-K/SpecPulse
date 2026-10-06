"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, Pause, Play } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { roleLabel } from "@/lib/session";

gsap.registerPlugin(ScrollTrigger);

const ROWS = [
  { label: "메모리", left: "12GB GDDR6X", right: "16GB GDDR6", win: "right" },
  { label: "전력", left: "220W", right: "263W", win: "left" },
  { label: "가격", left: "899,000원", right: "689,000원", win: "right" },
] as const;

export function LandingPage() {
  const root = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const { session, ready, logout } = useAuth();

  useLayoutEffect(() => {
    const scope = root.current;
    const video = videoRef.current;
    if (!scope) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      video?.pause();
      return;
    }

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(scope);

      gsap.from(q("[data-hero-copy]"), {
        y: 28,
        autoAlpha: 0,
        duration: 0.9,
        delay: 0.4,
        ease: "power3.out",
      });
      gsap.to(q("[data-cue]"), {
        y: 8,
        repeat: -1,
        yoyo: true,
        duration: 0.9,
        ease: "sine.inOut",
      });
      gsap.to(q("[data-progress]"), {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: scope, start: "top top", end: "bottom bottom", scrub: 0.3 },
      });

      const hero = q("[data-hero]")[0];
      if (video && hero) {
        gsap.to(video, {
          yPercent: 8,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
        });
      }
      gsap.to(q("[data-hero-copy]"), {
        autoAlpha: 0,
        y: -16,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "40% top", end: "bottom top", scrub: true },
      });

      const urls = q("[data-urls]")[0];
      if (urls) {
        gsap.from(q("[data-url]"), {
          x: (index: number) => (index === 0 ? -48 : 48),
          autoAlpha: 0,
          stagger: 0.12,
          duration: 0.75,
          ease: "power2.out",
          scrollTrigger: { trigger: urls, start: "top 78%" },
        });
      }

      mm.add("(min-width: 900px)", () => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: q("[data-stage]"),
            start: "top top",
            end: "+=150%",
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
          },
        });
        timeline
          .from(q("[data-card='left']"), { x: -120, autoAlpha: 0, duration: 0.7, ease: "power2.out" })
          .from(q("[data-card='right']"), { x: 120, autoAlpha: 0, duration: 0.7, ease: "power2.out" }, "<")
          .from(q("[data-vs]"), { scale: 0.4, autoAlpha: 0, duration: 0.35, ease: "back.out(1.7)" }, "-=0.2")
          .from(q("[data-row]"), { y: 26, autoAlpha: 0, stagger: 0.2, duration: 0.45, ease: "power2.out" })
          .to(
            q("[data-win]"),
            { backgroundColor: "rgba(88, 224, 168, 0.16)", color: "#58e0a8", duration: 0.4, ease: "power1.out" },
            "-=0.1",
          );
      });

      mm.add("(max-width: 899px)", () => {
        q("[data-mobile-reveal]").forEach((element) => {
          gsap.from(element, {
            y: 24,
            autoAlpha: 0,
            duration: 0.65,
            ease: "power2.out",
            scrollTrigger: { trigger: element, start: "top 90%" },
          });
        });
      });

      q("[data-block]").forEach((element) => {
        gsap.from(element, {
          y: 42,
          autoAlpha: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 82%" },
        });
      });

      const post = q("[data-post]")[0];
      const postTimeline = gsap.timeline({
        scrollTrigger: { trigger: post, start: "top 78%" },
      });
      postTimeline
        .from(q("[data-post]"), { y: 56, autoAlpha: 0, duration: 0.6, ease: "power3.out" })
        .from(q("[data-post-line]"), { y: 14, autoAlpha: 0, stagger: 0.1, duration: 0.35, ease: "power2.out" }, "-=0.25");

      gsap.from(q("[data-cta]"), {
        y: 24,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: { trigger: q("[data-cta-wrap]")[0], start: "top 80%" },
      });
    }, scope);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }

  return (
    <div ref={root} className="overflow-x-hidden bg-[#070B16] text-white">
      <div className="fixed inset-x-0 top-0 z-40 h-0.5 origin-left scale-x-0 bg-[#5b92ff]" data-progress />
      <header className="fixed inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-bold tracking-tight">
            SpecPulse
          </Link>
          <nav className="flex items-center gap-1 text-sm sm:gap-2" aria-label="주요">
            <Link href="/compare" className="rounded-full px-3 py-1.5 text-white/80 hover:bg-white/10 hover:text-white">
              스펙 비교
            </Link>
            <Link href="/gallery" className="rounded-full px-3 py-1.5 text-white/80 hover:bg-white/10 hover:text-white">
              마이너갤
            </Link>
            {session ? (
              <>
                <span className="hidden max-w-36 truncate text-xs text-white/60 sm:inline">
                  {session.name} · {roleLabel(session.role)}
                </span>
                <button type="button" onClick={logout} className="rounded-full px-3 py-1.5 text-xs text-white/70 hover:text-white">
                  로그아웃
                </button>
              </>
            ) : ready ? (
              <Link href="/login" className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#070B16]">
                로그인
              </Link>
            ) : (
              <span className="h-8 w-14" />
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <section data-hero className="relative h-[100svh] min-h-[640px] overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full bg-[#070B16] object-contain md:object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/landing/poster.jpg?v=2"
          preload="auto"
          aria-label="SpecPulse 소개 영상. 그래픽카드 두 장의 스펙이 나란히 비교되고, 구매 가이드와 마이너갤 글로 이어집니다."
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
        >
          <source src="/landing/hero.mp4?v=2" type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#070B16]/70 via-transparent to-[#070B16]" />
        <div data-hero-copy className="absolute inset-x-0 bottom-0 z-10 px-4 pb-10 sm:px-8">
          <div className="mx-auto flex max-w-6xl items-end justify-end gap-4">
            <div className="mb-1 flex items-center gap-3">
              <a href="#story" data-cue className="hidden items-center gap-2 text-xs text-white/70 sm:inline-flex">
                스크롤
                <ArrowDown className="size-4" />
              </a>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={paused ? "영상 재생" : "영상 일시정지"}
                className="grid size-10 place-items-center rounded-full border border-white/20 bg-black/40 text-white"
              >
                {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      <main id="story">
        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <div data-block>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#9db7ff]">01 주소</p>
            <h2 className="mt-3 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              상품 페이지 주소를 그대로 붙입니다
            </h2>
          </div>
          <div data-urls className="mt-10 grid gap-3 md:grid-cols-2">
            <p data-url className="truncate rounded-2xl border border-white/10 bg-white/5 px-4 py-4 font-mono text-xs text-white/80 sm:text-sm">
              https://demo.specpulse.app/rtx-4070-super
            </p>
            <p data-url className="truncate rounded-2xl border border-white/10 bg-white/5 px-4 py-4 font-mono text-xs text-white/80 sm:text-sm">
              https://demo.specpulse.app/rx-7800-xt
            </p>
          </div>
        </section>

        <section data-stage className="flex items-center px-4 py-20 md:min-h-[100svh] md:py-16 sm:px-6">
          <div className="mx-auto w-full max-w-5xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#9db7ff]">02 나란히</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">이긴 항목이 표 위에 남습니다</h2>
            <div className="mt-8 grid items-center gap-3 md:grid-cols-[1fr_auto_1fr] md:gap-5">
              <article data-card="left" data-mobile-reveal className="rounded-3xl border border-[#5b92ff]/40 bg-[#121826] p-5">
                <p className="text-xs font-semibold text-[#9db7ff]">NVIDIA · 그래픽카드</p>
                <h3 className="mt-2 text-2xl font-bold">RTX 4070 SUPER</h3>
                <p className="mt-1 text-sm text-white/70">899,000원</p>
              </article>
              <p
                data-vs
                data-mobile-reveal
                className="mx-auto grid size-12 place-items-center rounded-full border border-[#5b92ff]/50 text-xs font-bold"
              >
                VS
              </p>
              <article data-card="right" data-mobile-reveal className="rounded-3xl border border-[#b092ff]/40 bg-[#121826] p-5">
                <p className="text-xs font-semibold text-[#d4c4ff]">AMD · 그래픽카드</p>
                <h3 className="mt-2 text-2xl font-bold">RX 7800 XT</h3>
                <p className="mt-1 text-sm text-white/70">689,000원</p>
              </article>
            </div>
            <div className="mt-4 space-y-2">
              {ROWS.map((row) => (
                <div
                  key={row.label}
                  data-row
                  data-mobile-reveal
                  className="grid grid-cols-[4.5rem_1fr_1fr] items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm"
                >
                  <span className="text-white/50">{row.label}</span>
                  <span data-win={row.win === "left" ? true : undefined} className="w-fit rounded-full px-2 py-1">
                    {row.left}
                  </span>
                  <span data-win={row.win === "right" ? true : undefined} className="w-fit rounded-full px-2 py-1">
                    {row.right}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-24 sm:px-6 md:grid-cols-2 md:py-32">
          <div data-block>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#9db7ff]">03 가이드</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">살 이유를 한 문장으로 줄입니다</h2>
          </div>
          <blockquote data-block className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-xs font-semibold text-[#9db7ff]">AI 종합 구매 가이드</p>
            <p className="mt-3 text-2xl font-bold leading-snug">1440p 게임이라면 4070 SUPER</p>
            <p className="mt-3 text-sm leading-6 text-white/70">용량을 더 보면 16GB인 7800 XT.</p>
          </blockquote>
        </section>

        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-8 pb-24 sm:px-6 md:grid-cols-2 md:py-20">
          <article data-post className="rounded-3xl border border-white/10 bg-[#121826] p-6">
            <p data-post-line className="text-xs text-white/50">
              그래픽카드 마이너갤
            </p>
            <h3 data-post-line className="mt-3 text-xl font-bold leading-snug">
              RTX 4070 SUPER vs RX 7800 XT
              <span className="ml-2 inline-flex rounded-full bg-[#1e3a8a] px-2 py-0.5 align-middle text-[10px] font-semibold text-[#dbe5ff]">
                비교
              </span>
            </h3>
            <p data-post-line className="mt-3 text-sm leading-6 text-white/75">
              1440p에는 DLSS가 있는 쪽이 맞습니다. 용량을 더 보면 16GB.
            </p>
          </article>
          <div data-block>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#9db7ff]">04 갤러리</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">그 비교는 마이너갤 글이 됩니다</h2>
          </div>
        </section>

        <section data-cta-wrap className="px-4 py-24 text-center sm:px-6 sm:py-32">
          <h2 data-cta className="text-3xl font-bold tracking-tight sm:text-5xl">
            두 주소만 있으면 됩니다
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              data-cta
              href="/compare?sample=gpus"
              className="inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-[#070B16]"
            >
              그래픽카드로 미리 보기
            </Link>
            <Link
              data-cta
              href="/compare"
              className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 text-sm font-semibold"
            >
              직접 비교
            </Link>
            <Link data-cta href="/gallery" className="inline-flex h-12 items-center px-4 text-sm text-white/70 hover:text-white">
              마이너갤 둘러보기
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
