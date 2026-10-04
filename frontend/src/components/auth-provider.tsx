"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { fetchMe } from "@/lib/gallery";
import { clearToken, readSession, serverSession, SESSION_EVENT, subscribeSession, type Session } from "@/lib/session";

type AuthValue = {
  session: Session | null;
  ready: boolean;
  logout: () => void;
  refresh: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = useSyncExternalStore(subscribeSession, readSession, serverSession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    let checking = false;
    const confirm = async () => {
      if (checking) return;
      if (!readSession()) {
        if (alive) setReady(true);
        return;
      }
      checking = true;
      try {
        await fetchMe();
      } catch {
        // A rejected token is already cleared. Other failures keep the local session.
      } finally {
        checking = false;
      }
      if (alive) setReady(true);
    };
    void confirm();
    const onSession = () => {
      void confirm();
    };
    window.addEventListener(SESSION_EVENT, onSession);
    return () => {
      alive = false;
      window.removeEventListener(SESSION_EVENT, onSession);
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      ready,
      refresh: () => {
        readSession();
      },
      logout: () => {
        clearToken();
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
