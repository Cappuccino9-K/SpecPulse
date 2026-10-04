"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readSession, SESSION_EVENT, TOKEN_KEY, type Session } from "@/lib/session";

type AuthValue = {
  session: Session | null;
  ready: boolean;
  logout: () => void;
  refresh: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  function refresh() {
    setSession(readSession());
    setReady(true);
  }

  useEffect(() => {
    refresh();
    const sync = () => refresh();
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      ready,
      refresh,
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        setSession(null);
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
