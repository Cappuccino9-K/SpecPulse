"use client";

import { Activity } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "스펙 비교" },
  { href: "/gallery", label: "마이너갤" },
];

export function SiteHeader() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-on-primary">
            <Activity className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-bold tracking-tight">SpecPulse</span>
            <span className="hidden truncate text-xs text-muted sm:block">스펙은 나란히, 이야기는 갤러리에서</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="flex items-center rounded-full bg-surface-container p-1" aria-label="주요">
            {LINKS.map((link) => {
              const active = link.href === "/" ? path === "/" : path.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition",
                    active ? "bg-surface text-on-surface elev-1" : "text-muted hover:text-on-surface",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
