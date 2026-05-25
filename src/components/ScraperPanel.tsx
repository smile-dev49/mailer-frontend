import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { ScraperStatus } from "../types";

export function ScraperPanel() {
  const [status, setStatus] = useState<ScraperStatus | null>(null);
  const [maxPerLocation, setMaxPerLocation] = useState(50);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const poll = () =>
      api.getScraperStatus().then(setStatus).catch(() => {});
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, []);

  async function handleStart() {
    setMessage(null);
    try {
      await api.startScraper(maxPerLocation);
      setMessage({ type: "ok", text: "Scraper started" });
      const s = await api.getScraperStatus();
      setStatus(s);
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Start failed",
      });
    }
  }

  return (
    <div className="panel">
      <h2>GitHub scraper</h2>
      {message && (
        <div className={`alert alert-${message.type === "ok" ? "success" : "error"}`}>
          {message.text}
        </div>
      )}

      {status && (
        <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
          <strong>{status.running ? "Running" : "Idle"}</strong>
          {status.message && <> — {status.message}</>}
          {status.last_location && (
            <>
              <br />
              Location: {status.last_location}
            </>
          )}
          <br />
          Users collected: {status.users_collected}
          {status.error && (
            <>
              <br />
              <span style={{ color: "#fca5a5" }}>Error: {status.error}</span>
            </>
          )}
        </div>
      )}

      <div className="field">
        <label>Max users per location</label>
        <input
          type="number"
          min={1}
          max={500}
          value={maxPerLocation}
          onChange={(e) => setMaxPerLocation(Number(e.target.value))}
        />
        <p className="field-hint">
          Saves to united_state_github_users.db (existing emails are kept, not wiped)
        </p>
      </div>

      <div className="actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleStart}
          disabled={status?.running}
        >
          {status?.running ? "Scraping…" : "Start scraper"}
        </button>
      </div>
    </div>
  );
}
