import type {
  MailSendResult,
  MailStats,
  MailWorkerConfig,
  MailWorkerListItem,
  MailWorkerSavePayload,
  ScraperCountry,
  ScraperStatus,
  SentMailItem,
  TokenItem,
  TokenSavePayload,
  TokenStatus,
  UserFilterOptions,
  UserFilters,
  UsersList,
} from "../types";

/** Empty in dev (Vite proxy). Set VITE_API_URL in Frontend/.env for direct calls. */
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

function appendUserFilters(params: URLSearchParams, filters?: UserFilters) {
  if (!filters) return;
  if (filters.scrape_country?.trim()) {
    params.set("scrape_country", filters.scrape_country.trim());
  }
  if (filters.location?.trim()) {
    params.set("location", filters.location.trim());
  }
  if (filters.search_location?.trim()) {
    params.set("search_location", filters.search_location.trim());
  }
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

  getUserFilterOptions: () => request<UserFilterOptions>("/api/users/filters"),

  getUsers: (page = 1, limit = 50, filters?: UserFilters) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    appendUserFilters(params, filters);
    return request<UsersList>(`/api/users?${params}`);
  },

  getScraperCountries: () => request<ScraperCountry[]>("/api/scraper/countries"),
  getScraperStatus: () => request<ScraperStatus>("/api/scraper/status"),
  startScraper: (country_id: number, max_per_location: number) =>
    request<ScraperStatus>("/api/scraper/start", {
      method: "POST",
      body: JSON.stringify({ country_id, max_per_location }),
    }),

  listMailWorkers: () => request<MailWorkerListItem[]>("/api/mail-worker"),
  getMailWorkerById: (id: number) =>
    request<MailWorkerConfig>(`/api/mail-worker/${id}`),
  createMailWorker: (body: MailWorkerSavePayload) =>
    request<MailWorkerConfig>("/api/mail-worker", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateMailWorker: (id: number, body: MailWorkerSavePayload) =>
    request<MailWorkerConfig>(`/api/mail-worker/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  activateMailWorker: (id: number) =>
    request<MailWorkerConfig>(`/api/mail-worker/${id}/activate`, {
      method: "POST",
    }),

  getMailStats: (filters?: UserFilters) => {
    const params = new URLSearchParams();
    appendUserFilters(params, filters);
    const q = params.toString();
    return request<MailStats>(`/api/mail/stats${q ? `?${q}` : ""}`);
  },

  sendMailBatch: (limit?: number, filters?: UserFilters) =>
    request<MailSendResult>("/api/mail/send", {
      method: "POST",
      body: JSON.stringify({
        limit: limit ?? null,
        scrape_country: filters?.scrape_country?.trim() || null,
        location: filters?.location?.trim() || null,
        search_location: filters?.search_location?.trim() || null,
      }),
    }),
  listSent: (limit = 50) =>
    request<SentMailItem[]>(`/api/mail/sent?limit=${limit}`),
};
