import { LoginScreen } from "@/components/login-screen";
import { fetchAuthConfig } from "@/lib/gallery";
import type { AuthConfig } from "@/types/account";

export const dynamic = "force-dynamic";

async function loadAuthConfig(): Promise<AuthConfig | null> {
  try {
    return await fetchAuthConfig();
  } catch {
    return null;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params.error;
  const error = Array.isArray(raw) ? raw[0] : raw;
  const initial = await loadAuthConfig();
  return <LoginScreen error={error} initial={initial} />;
}
