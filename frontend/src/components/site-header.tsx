"use client";

import { Activity, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { roleLabel } from "@/lib/session";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/compare", label: "스펙 비교" },
  { href: "/gallery", label: "마이너갤" },
];

export function SiteHeader() {
  const path = usePathname();
  const { session, ready, logout } = useAuth();
  const staff = session?.role === "ADMIN" || session?.role === "MODERATOR";

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-[1240px] flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-on-primary">
            <Activity className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-bold tracking-tight">SpecPulse</span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <nav className="flex items-center rounded-full bg-surface-container p-1" aria-label="주요">
            {LINKS.map((link) => {
              const active = path === link.href || path.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm",
                    active ? "bg-surface text-on-surface elev-1" : "text-muted hover:text-on-surface",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          {session ? (
            <div className="flex items-center gap-1">
              {staff ? (
                <Link href="/gallery/requests" className="rounded-full px-2 py-1 text-xs text-muted hover:text-on-surface">
                  요청
                </Link>
              ) : null}
              {session.role === "ADMIN" ? (
                <Link href="/gallery/members" className="rounded-full px-2 py-1 text-xs text-muted hover:text-on-surface">
                  회원
                </Link>
              ) : null}
              <span className="max-w-28 truncate text-xs text-muted sm:max-w-40" title={session.email}>
                {session.name} · {roleLabel(session.role)}
              </span>
              <button
                type="button"
                onClick={logout}
                aria-label="로그아웃"
                className="grid size-10 place-items-center rounded-full border border-line bg-surface text-on-surface"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : ready ? (
            <Link href="/login" className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary sm:text-sm">
              로그인
            </Link>
          ) : (
            <span className="h-8 w-16" />
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
