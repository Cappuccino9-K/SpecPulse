"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { endSession, fetchMe } from "@/lib/gallery";
import { clearToken, readSession, serverSession, SESSION_EVENT, subscribeSession, type GalleryRole, type Session } from "@/lib/session";

type AuthValue = {
  session: Session | null;
  ready: boolean;
  logout: () => void;
  refresh: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

function asSession(me: { name: string; email: string; role: string }): Session | null {
  if (me.role !== "USER" && me.role !== "MODERATOR" && me.role !== "ADMIN") return null;
  return { name: me.name || me.email || "회원", email: me.email || "", role: me.role as GalleryRole };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hinted = useSyncExternalStore(subscribeSession, readSession, serverSession);
  const [confirmed, setConfirmed] = useState<Session | null | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const checking = useRef(false);
  const skip = useRef(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (skip.current || checking.current) return;
      checking.current = true;
      try {
        const session = asSession(await fetchMe());
        if (!alive || skip.current) return;
        setConfirmed(session);
      } catch (error) {
        if (!alive || skip.current) return;
        const message = error instanceof Error ? error.message : "";
        if (message.includes("연결하지 못했습니다")) return;
        setConfirmed(null);
        if (message.includes("로그인")) {
          clearToken();
          void endSession();
        }
      } finally {
        checking.current = false;
        if (alive) setReady(true);
      }
    };
    void load();
    const onSession = () => {
      void load();
    };
    window.addEventListener(SESSION_EVENT, onSession);
    window.addEventListener("focus", onSession);
    return () => {
      alive = false;
      window.removeEventListener(SESSION_EVENT, onSession);
      window.removeEventListener("focus", onSession);
    };
  }, []);

  const session = confirmed === undefined ? hinted : confirmed;

  const value = useMemo<AuthValue>(
    () => ({
      session,
      ready,
      refresh: () => {
        readSession();
      },
      logout: () => {
        skip.current = true;
        setConfirmed(null);
        setReady(true);
        clearToken();
        void endSession().finally(() => {
          skip.current = false;
        });
      },
    }),
    [session, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider가 없습니다.");
  return value;
}
