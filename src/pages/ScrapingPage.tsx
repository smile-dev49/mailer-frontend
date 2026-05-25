import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { ScrapedUserModal } from "../components/ScrapedUserModal";
import { ROUTES } from "../routes";
import type { GitHubUser, ScraperLiveUser, ScraperStatus } from "../types";

const PAGE_SIZE = 20;

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
  const [viewUser, setViewUser] = useState<GitHubUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const runningRef = useRef(false);
  const wasRunningRef = useRef(false);

  const loadUsers = useCallback(async (p: number) => {
    const data = await api.getUsers(p, PAGE_SIZE);
    setUsers(data.items);
    setTotalUsers(data.total);
    setPage(data.page);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      api.getScraperStatus().then(setStatus),
      loadUsers(page),
    ]);
  }, [loadUsers, page]);

  useEffect(() => {
    api.getTokens().then((t) => setHasToken(t.has_active_token));
    loadUsers(1).catch(() => {});

    const poll = () =>
      api
        .getScraperStatus()
        .then((s) => {
          setStatus(s);
        })
        .catch(() => {});

    poll();
    let timeoutId: ReturnType<typeof setTimeout>;
    const schedule = () => {
      poll();
      timeoutId = setTimeout(schedule, runningRef.current ? 1000 : 3000);
    };
    schedule();
    return () => clearTimeout(timeoutId);
  }, [loadUsers]);

  useEffect(() => {
    runningRef.current = status?.running ?? false;
  }, [status?.running]);

  useEffect(() => {
    const running = status?.running ?? false;
    if (wasRunningRef.current && !running) {
      loadUsers(1).catch(() => {});
    }
    wasRunningRef.current = running;
  }, [status?.running, loadUsers]);

  useEffect(() => {
    if (!status?.running) return;
    const id = setInterval(() => loadUsers(1).catch(() => {}), 5000);
    return () => clearInterval(id);
  }, [status?.running, loadUsers]);

  async function startScraper() {
    setMessage(null);
    try {
      await api.startScraper(maxPerLocation);
      setMessage({ type: "ok", text: "Scraper started" });
      runningRef.current = true;
      setStatus(await api.getScraperStatus());
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Start failed",
      });
    }
  }

  function openView(user: GitHubUser) {
    setViewUser(user);
    setModalOpen(true);
  }

  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const dbTotal = status?.db_total ?? totalUsers;

  return (
    <div className="page">
      <header className="page-header">
        <h2>Scraping Setting</h2>
        <p>
          Run the GitHub scraper, watch live results, and browse scraped users in the
          table. Click View for full details.
        </p>
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
        <div className="panel__toolbar">
          <h3>Run scraper</h3>
          <div className="panel__toolbar-actions actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={startScraper}
              disabled={status?.running || !hasToken}
            >
              {status?.running ? "Scraping…" : "Start scraper"}
            </button>
          </div>
        </div>
        <ScraperStatusBox status={status} dbTotal={dbTotal} />
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
      </div>

      <div className="panel">
        <h3>
          Live results
          {status?.running
            ? ` (${status.users_collected} this run)`
            : status
              ? ` (${status.users_collected} last run)`
              : ""}
        </h3>
        <LiveFeed feed={status?.live_feed ?? []} running={status?.running ?? false} />
      </div>

      <div className="panel">
        <div className="panel__toolbar">
          <h3>Scraped users ({totalUsers})</h3>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => refreshAll().catch(() => {})}
          >
            Refresh
          </button>
        </div>

        {users.length === 0 ? (
          <p className="field-hint">
            No users in the database yet. Register a token and start the scraper.
          </p>
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.email}>
                      <td>{u.email}</td>
                      <td>{u.name ?? "—"}</td>
                      <td className="cell-truncate" title={u.location ?? undefined}>
                        {u.location ?? "—"}
                      </td>
                      <td>
                        {u.updated_at
                          ? new Date(u.updated_at).toLocaleString()
                          : "—"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openView(u)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          </>
        )}
      </div>

      <ScrapedUserModal
        open={modalOpen}
        user={viewUser}
        onClose={() => {
          setModalOpen(false);
          setViewUser(null);
        }}
      />
    </div>
  );
}

function ScraperStatusBox({
  status,
  dbTotal,
}: {
  status: ScraperStatus | null;
  dbTotal: number;
}) {
  if (!status) return null;

  const locationProgress =
    status.locations_total > 0
      ? Math.round((status.locations_done / status.locations_total) * 100)
      : 0;

  return (
    <div className={`scraper-status ${status.running ? "scraper-status--running" : ""}`}>
      <div className="scraper-status__row">
        <span className={`scraper-status__badge ${status.running ? "is-running" : ""}`}>
          {status.running ? "Running" : "Idle"}
        </span>
        <span className="scraper-status__message">{status.message || "—"}</span>
      </div>

      {status.running && status.locations_total > 0 && (
        <div className="scraper-status__progress">
          <div className="scraper-status__progress-label">
            Locations {status.locations_done} / {status.locations_total} ({locationProgress}
            %)
          </div>
          <div className="scraper-status__progress-bar">
            <div
              className="scraper-status__progress-fill"
              style={{ width: `${locationProgress}%` }}
            />
          </div>
        </div>
      )}

      <dl className="scraper-status__details">
        {status.last_location && (
          <>
            <dt>Current location</dt>
            <dd>{status.last_location}</dd>
          </>
        )}
        {status.current_username && (
          <>
            <dt>Checking user</dt>
            <dd>@{status.current_username}</dd>
          </>
        )}
        <dt>Collected this run</dt>
        <dd>{status.users_collected}</dd>
        <dt>Total in database</dt>
        <dd>{dbTotal}</dd>
      </dl>

      {status.error && <p className="text-error">{status.error}</p>}
    </div>
  );
}

function LiveFeed({
  feed,
  running,
}: {
  feed: ScraperLiveUser[];
  running: boolean;
}) {
  if (feed.length === 0) {
    return (
      <p className="field-hint">
        {running
          ? "Scraper is running — users with a public email will appear here one by one."
          : "No results yet. Start the scraper to see live output."}
      </p>
    );
  }

  return (
    <ol className="live-feed">
      {feed.map((u, index) => (
        <li
          key={`${u.email}-${u.scraped_at}`}
          className={`live-feed__item ${index === 0 && running ? "live-feed__item--new" : ""}`}
        >
          <div className="live-feed__main">
            <strong>{u.email}</strong>
            {u.name && <span className="live-feed__name"> — {u.name}</span>}
          </div>
          <div className="live-feed__meta">
            {u.location && <span>{u.location}</span>}
            {u.html_url && (
              <a href={u.html_url} target="_blank" rel="noreferrer">
                GitHub
              </a>
            )}
            <time dateTime={u.scraped_at}>
              {new Date(u.scraped_at).toLocaleTimeString()}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
