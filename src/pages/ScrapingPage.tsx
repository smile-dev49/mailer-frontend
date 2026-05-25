import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { ROUTES } from "../routes";
import type { GitHubUser, ScraperStatus } from "../types";

export function ScrapingPage() {
  const [hasToken, setHasToken] = useState(false);
  const [maxPerLocation, setMaxPerLocation] = useState(50);
  const [status, setStatus] = useState<ScraperStatus | null>(null);
  const [users, setUsers] = useState<GitHubUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const loadUsers = useCallback(async (p: number) => {
    const data = await api.getUsers(p, 20);
    setUsers(data.items);
    setTotalUsers(data.total);
    setPage(data.page);
  }, []);

  useEffect(() => {
    api.getTokens().then((t) => setHasToken(t.has_active_token));
    loadUsers(1).catch(() => {});
    const poll = () => api.getScraperStatus().then(setStatus).catch(() => {});
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [loadUsers]);

  async function startScraper() {
    setMessage(null);
    try {
      await api.startScraper(maxPerLocation);
      setMessage({ type: "ok", text: "Scraper started" });
      setStatus(await api.getScraperStatus());
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Start failed",
      });
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalUsers / 20));

  return (
    <div className="page">
      <header className="page-header">
        <h2>Scraping Setting</h2>
        <p>Run the GitHub scraper and view collected users</p>
      </header>

      {message && (
        <div className={`alert alert-${message.type === "ok" ? "success" : "error"}`}>
          {message.text}
        </div>
      )}

      {!hasToken && (
        <div className="alert alert-info">
          No active GitHub token.{" "}
          <Link to={ROUTES.registerToken}>Register Token</Link> first.
        </div>
      )}

      <div className="panel">
        <h3>Run scraper</h3>
        <ScraperStatusBox status={status} />
        <div className="field">
          <label>Max users per location</label>
          <input
            type="number"
            min={1}
            max={500}
            value={maxPerLocation}
            onChange={(e) => setMaxPerLocation(Number(e.target.value))}
          />
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={startScraper}
            disabled={status?.running || !hasToken}
          >
            {status?.running ? "Scraping…" : "Start scraper"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => loadUsers(page).catch(() => {})}
          >
            Refresh users
          </button>
        </div>
      </div>

      <div className="panel">
        <h3>Scraped users ({totalUsers})</h3>
        <UsersTable users={users} />
        {totalPages > 1 && (
          <div className="actions">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={page <= 1}
              onClick={() => loadUsers(page - 1).catch(() => {})}
            >
              Previous
            </button>
            <span className="field-hint">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={page >= totalPages}
              onClick={() => loadUsers(page + 1).catch(() => {})}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ScraperStatusBox({ status }: { status: ScraperStatus | null }) {
  if (!status) return null;
  return (
    <div className="alert alert-info">
      <strong>{status.running ? "Running" : "Idle"}</strong>
      {status.message && <> — {status.message}</>}
      {status.last_location && (
        <>
          <br />
          Location: {status.last_location}
        </>
      )}
      <br />
      Collected this run: {status.users_collected}
      {status.error && (
        <>
          <br />
          <span className="text-error">{status.error}</span>
        </>
      )}
    </div>
  );
}

function UsersTable({ users }: { users: GitHubUser[] }) {
  if (users.length === 0) {
    return (
      <p className="field-hint">
        No users yet. Register a token and run the scraper.
      </p>
    );
  }
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Location</th>
            <th>Profile</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.email}>
              <td>{u.email}</td>
              <td>{u.name ?? "—"}</td>
              <td>{u.location ?? "—"}</td>
              <td>
                {u.html_url ? (
                  <a href={u.html_url} target="_blank" rel="noreferrer">
                    GitHub
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
