import { auth } from "@/lib/auth";

const API = process.env.API_URL ?? "https://api-m2.baptisthecht.fr/api";

async function getToken(): Promise<string | null> {
  const session = await auth();
  return (session as any)?.accessToken ?? null;
}

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((opts.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers,
    next: { revalidate: 0 }, // always fresh for trading data
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json();
}

// ── Auth ──
export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json() as Promise<{ user: any; token: string }>;
}

// ── Users ──
export const getProfile = () => apiFetch<any>("/users/me");

// ── Strategies ──
export const getStrategies = () => apiFetch<any[]>("/strategies");
export const getStrategy = (id: string) => apiFetch<any>(`/strategies/${id}`);

// ── Sessions ──
export const getSessions = () => apiFetch<any[]>("/sessions");
export const getRunningSessions = () => apiFetch<any[]>("/sessions/running");
export const getSession = (id: string) => apiFetch<any>(`/sessions/${id}`);
export const startSession = (data: any) =>
  apiFetch<any>("/sessions/start", { method: "POST", body: JSON.stringify(data) });
export const stopSession = (id: string) => apiFetch<any>(`/sessions/${id}/stop`, { method: "POST" });

// ── Trades ──
export const getTrades = (sessionId: string, limit = 100) =>
  apiFetch<any[]>(`/trades/session/${sessionId}?limit=${limit}`);

// ── Signal Evaluations ──
export const getEvaluations = (sessionId: string, limit = 50, result?: string) => {
  let url = `/signal-evaluations/session/${sessionId}?limit=${limit}`;
  if (result) url += `&result=${result}`;
  return apiFetch<any[]>(url);
};
export const getEvaluation = (id: string) => apiFetch<any>(`/signal-evaluations/${id}`);
