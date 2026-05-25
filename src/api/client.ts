import type {
  MailSendResult,
  MailStats,
  MailWorkerConfig,
  MailWorkerSavePayload,
  ScraperStatus,
  SentMailItem,
  TokenItem,
  TokenSavePayload,
  TokenStatus,
  UsersList,
} from "../types";

/** Empty in dev (Vite proxy). Set VITE_API_URL in Frontend/.env for direct calls. */
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail)
    );
  }
  return res.json() as Promise<T>;
}

export const api = {
  getTokens: () => request<TokenStatus>("/api/tokens"),
  saveToken: (payload: TokenSavePayload) =>
    request<TokenItem>("/api/tokens", {
      method: "POST",
      body: JSON.stringify({
        access_token: payload.access_token,
        gmail_email: payload.gmail_email,
        label: payload.label ?? "default",
      }),
    }),

  getUsers: (page = 1, limit = 50) =>
    request<UsersList>(`/api/users?page=${page}&limit=${limit}`),

  getScraperStatus: () => request<ScraperStatus>("/api/scraper/status"),
  startScraper: (max_per_location: number) =>
    request<ScraperStatus>("/api/scraper/start", {
      method: "POST",
      body: JSON.stringify({ max_per_location }),
    }),

  getMailWorker: () => request<MailWorkerConfig>("/api/mail-worker"),
  saveMailWorker: (body: MailWorkerSavePayload) =>
    request<MailWorkerConfig>("/api/mail-worker", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  getMailStats: () => request<MailStats>("/api/mail/stats"),
  sendMailBatch: (limit?: number) =>
    request<MailSendResult>("/api/mail/send", {
      method: "POST",
      body: JSON.stringify({ limit: limit ?? null }),
    }),
  listSent: (limit = 50) =>
    request<SentMailItem[]>(`/api/mail/sent?limit=${limit}`),
};
