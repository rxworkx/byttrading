import { getApiUrl } from "./api-url";

const API_URL = getApiUrl();

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    throw new Error(`API request to ${path} failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  slug: string;
  rateRange: string;
  rateNote: string | null;
  pricing: Partial<Record<"6mo" | "1yr", number>>;
  term: string | null;
  payFrequency: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
}
