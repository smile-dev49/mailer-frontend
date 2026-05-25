export interface MailSettings {
  google_email: string;
  google_password_set: boolean;
  sending_limit: number;
  send_delay_seconds: number;
}

export interface TokenItem {
  id: number;
  label: string;
  access_token_masked: string;
  gmail_email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenStatus {
  has_active_token: boolean;
  has_active_gmail: boolean;
  active_gmail_email: string;
  tokens: TokenItem[];
}

export interface TokenSavePayload {
  access_token: string;
  gmail_email: string;
  label?: string;
}

export interface GitHubUser {
  email: string;
  html_url: string | null;
  name: string | null;
  location: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UsersList {
  total: number;
  items: GitHubUser[];
  page: number;
  limit: number;
}

export interface MailStats {
  total: number;
  sent: number;
  pending: number;
  storage: string;
}

export interface MailSendResult {
  sent_count: number;
  failed_count: number;
  total_sent: number;
  pending: number;
  message: string;
}

export interface ScraperStatus {
  running: boolean;
  message: string;
  users_collected: number;
  last_location: string;
  error: string | null;
}

export interface SentMailItem {
  email: string;
  name: string | null;
  sent_at: string;
  subject: string | null;
}
