export const TOKEN_KEY = "specpulse-gallery-token";

export type GalleryRole = "USER" | "MODERATOR" | "ADMIN";

export type Session = {
  name: string;
  email: string;
  role: GalleryRole;
};

export function roleLabel(role: GalleryRole): string {
  if (role === "ADMIN") return "어드민";
  if (role === "MODERATOR") return "모더레이터";
  return "사용자";
}

export const SESSION_EVENT = "specpulse-session";

export function notifySession() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function subscribeSession(onChange: () => void) {
  const listener = () => onChange();
  window.addEventListener(SESSION_EVENT, listener);
  window.addEventListener("storage", listener);
  window.addEventListener("focus", listener);
  return () => {
    window.removeEventListener(SESSION_EVENT, listener);
    window.removeEventListener("storage", listener);
    window.removeEventListener("focus", listener);
  };
}

function decodePart(part: string): { name?: string; email?: string; role?: string; exp?: number } {
  const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as { name?: string; email?: string; role?: string; exp?: number };
}

function readCookie(): string {
  const prefix = `${TOKEN_KEY}=`;
  const found = document.cookie.split("; ").find((part) => part.startsWith(prefix));
  if (!found) return "";
  try {
    return decodeURIComponent(found.slice(prefix.length)).trim();
  } catch {
    return "";
  }
}

function writeCookie(token: string) {
  const maxAge = token ? 60 * 60 * 24 * 7 : 0;
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function currentToken(): string {
  const stored = localStorage.getItem(TOKEN_KEY)?.trim() ?? "";
  const token = stored || readCookie();
  if (!token || token === blockedToken) return "";
  if (!stored) localStorage.setItem(TOKEN_KEY, token);
  return token;
}

let snapshotToken: string | null = null;
let snapshot: Session | null = null;
let blockedToken = "";

function remember(token: string, session: Session | null) {
  snapshotToken = token;
  snapshot = session;
}

export function persistToken(token: string) {
  const value = token.trim();
  blockedToken = "";
  localStorage.setItem(TOKEN_KEY, value);
  writeCookie(value);
  snapshotToken = null;
  notifySession();
}

export function clearToken() {
  const token = localStorage.getItem(TOKEN_KEY)?.trim() || readCookie();
  if (token) blockedToken = token;
  localStorage.removeItem(TOKEN_KEY);
  writeCookie("");
  remember("", null);
  notifySession();
}

export function readSession(): Session | null {
  const token = currentToken();
  if (token === snapshotToken) return snapshot;
  if (!token) {
    remember("", null);
    return null;
  }
  try {
    const part = token.split(".");
    if (part.length < 2 || !part[1]) throw new Error("empty");
    const payload = decodePart(part[1]);
    if (!payload.exp || payload.exp * 1000 <= Date.now()) throw new Error("expired");
    const role = payload.role;
    if (role !== "USER" && role !== "MODERATOR" && role !== "ADMIN") throw new Error("role");
    const session: Session = { name: payload.name || payload.email || "회원", email: payload.email || "", role };
    remember(token, session);
    return session;
  } catch {
    blockedToken = token;
    localStorage.removeItem(TOKEN_KEY);
    writeCookie("");
    remember("", null);
    return null;
  }
}

export function serverSession(): Session | null {
  return null;
}
