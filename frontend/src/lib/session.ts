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

function decodePart(part: string): { name?: string; email?: string; role?: string; exp?: number } {
  const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as { name?: string; email?: string; role?: string; exp?: number };
}

export function readSession(): Session | null {
  const token = localStorage.getItem(TOKEN_KEY)?.trim();
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) throw new Error("empty");
    const payload = decodePart(part);
    if (!payload.exp || payload.exp * 1000 <= Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    if (payload.role !== "USER" && payload.role !== "MODERATOR" && payload.role !== "ADMIN") return null;
    return { name: payload.name || payload.email || "회원", email: payload.email || "", role: payload.role };
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}
