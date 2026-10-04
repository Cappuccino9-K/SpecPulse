"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/components/auth-provider";
import { fetchMembers, updateMemberRole } from "@/lib/gallery";
import { roleLabel } from "@/lib/session";
import type { GalleryRole, Member } from "@/types/account";

const ROLES: GalleryRole[] = ["USER", "MODERATOR", "ADMIN"];

export default function MembersPage() {
  const { session, ready } = useAuth();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || session?.role !== "ADMIN") return;
    fetchMembers()
      .then(setMembers)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "회원 목록을 불러오지 못했습니다."));
  }, [ready, session?.role]);

  async function change(member: Member, role: GalleryRole) {
    setError("");
    try {
      const updated = await updateMemberRole(member.id, role);
      setMembers((current) => current?.map((item) => (item.id === updated.id ? updated : item)) ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "역할을 바꾸지 못했습니다.");
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Link href="/gallery" className="text-xs font-medium text-primary">
          마이너갤
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">회원 역할</h1>
        <p className="mt-1 text-sm text-muted">어드민만 역할을 바꿉니다. 모더레이터와 어드민은 갤러리를 직접 만들고, 사용자는 요청 후 승인을 받습니다.</p>
        {ready && session?.role !== "ADMIN" ? <p className="mt-4 text-sm text-muted">어드민 계정으로 로그인해야 합니다.</p> : null}
        {error ? (
          <p role="alert" className="mt-4 rounded-2xl border border-danger/30 bg-danger-container px-4 py-3 text-sm text-on-danger-container">
            {error}
          </p>
        ) : null}
        <ul className="mt-4 space-y-3">
          {members?.map((member) => (
            <li key={member.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium">{member.name}</p>
                <p className="truncate text-xs text-muted">{member.email}</p>
              </div>
              <label className="block text-xs text-muted">
                역할
                <select
                  value={member.role}
                  onChange={(event) => change(member, event.target.value as GalleryRole)}
                  className="mt-1 h-10 w-full rounded-xl border border-outline bg-surface px-3 text-sm text-on-surface sm:w-40"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
