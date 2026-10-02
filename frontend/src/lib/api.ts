import type { CompareResponse, HistoryItem, Preset, Provider } from "@/types/analysis";

async function errorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      const text = data.detail
        .map((item) => (item && typeof item === "object" && "msg" in item ? String(item.msg) : ""))
        .filter(Boolean)
        .join(" ");
      if (text) return text;
    }
  } catch {
    return "분석을 끝내지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
  return "분석을 끝내지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export async function compareProducts(urls: [string, string], provider: Provider): Promise<CompareResponse> {
  let response: Response;
  try {
    response = await fetch("/backend-api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls, provider }),
    });
  } catch {
    throw new Error("API 서버에 연결하지 못했습니다. 백엔드가 실행 중인지 확인해 주세요.");
  }
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json() as Promise<CompareResponse>;
}

export async function fetchHistory(): Promise<HistoryItem[]> {
  const response = await fetch("/backend-api/history", { cache: "no-store" });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json() as Promise<HistoryItem[]>;
}

export async function fetchComparison(id: string): Promise<CompareResponse> {
  const response = await fetch(`/backend-api/history/${id}`, { cache: "no-store" });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json() as Promise<CompareResponse>;
}

export async function deleteComparison(id: string): Promise<void> {
  const response = await fetch(`/backend-api/history/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await errorMessage(response));
}

export async function fetchPresets(): Promise<Preset[]> {
  const response = await fetch("/backend-api/presets", { cache: "no-store" });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json() as Promise<Preset[]>;
}
