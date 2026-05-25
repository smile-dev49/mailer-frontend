export interface MailSettings {
  google_email: string;
  google_password_set: boolean;
  sending_limit: number;
  send_delay_seconds: number;
}

export interface MailWorkerListItem {
  id: number;
  first_name: string;
  last_name: string;
  gmail_email: string;
  subject_preview: string;
  sending_limit: number;
  send_delay_seconds: number;
  app_password_set: boolean;
  is_active: boolean;
  updated_at: string;
}

export interface MailWorkerConfig {
  id: number;
  first_name: string;
  last_name: string;
  gmail_email: string;
  app_password_set: boolean;
  subject: string;
  content: string;
  sending_limit: number;
  send_delay_seconds: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MailWorkerSavePayload {
  first_name: string;
  last_name: string;
  gmail_email: string;
  app_password?: string;
  subject: string;
  content: string;
  sending_limit: number;
  send_delay_seconds: number;
  set_active?: boolean;
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
  scrape_country: string;
  search_location: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserFilters {
  scrape_country?: string;
  location?: string;
  search_location?: string;
}

export interface UserFilterOptions {
  scrape_countries: string[];
  search_locations: string[];
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

export interface ScraperLiveUser {
  email: string;
  name: string | null;
  location: string | null;
  search_location?: string;
  scrape_country?: string;
  html_url: string | null;
  scraped_at: string;
}

export interface ScraperCountry {
  id: number;
  code: string;
  name: string;
  location_count: number;
}

export interface ScraperStatus {
  running: boolean;
  message: string;
  users_collected: number;
  db_total: number;
  country_id: number | null;
  country_name: string;
  last_location: string;
  current_username: string;
  locations_done: number;
  locations_total: number;
  live_feed: ScraperLiveUser[];
  error: string | null;
  profiles_checked?: number;
  skipped_no_email?: number;
  skipped_other?: number;
}

export interface SentMailItem {
  email: string;
  name: string | null;
  sent_at: string;
  subject: string | null;
}
