import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { MailStats, SentMailItem } from "../types";

export function MailPanel() {
  const [stats, setStats] = useState<MailStats | null>(null);
  const [sent, setSent] = useState<SentMailItem[]>([]);
  const [limit, setLimit] = useState<number | "">("");
  const [message, setMessage] = useState<{ type: "ok" | "err" | "info"; text: string } | null>(
    null
  );
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    const [s, list] = await Promise.all([api.getMailStats(), api.listSent(30)]);
    setStats(s);
    setSent(list);
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  async function handleSend() {
    setSending(true);
    setMessage(null);
    try {
      const result = await api.sendMailBatch(
        limit === "" ? undefined : Number(limit)
      );
      setMessage({ type: "ok", text: result.message });
      await refresh();
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Send failed",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="panel">
      <h2>Send mail</h2>
      {message && (
        <div
          className={`alert alert-${
            message.type === "err" ? "error" : message.type === "info" ? "info" : "success"
          }`}
        >
          {message.text}
        </div>
      )}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="value">{stats.total}</div>
            <div className="label">In mail list ({stats.users_db})</div>
          </div>
          <div className="stat-card">
            <div className="value">{stats.sent}</div>
            <div className="label">Already sent ({stats.sent_db})</div>
          </div>
          <div className="stat-card">
            <div className="value">{stats.pending}</div>
            <div className="label">Pending</div>
          </div>
        </div>
      )}

      <div className="field">
        <label>Override limit (optional)</label>
        <input
          type="number"
          min={1}
          placeholder="Uses SENDING_LIMIT_TO_SET from settings"
          value={limit}
          onChange={(e) =>
            setLimit(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
      </div>

      <div className="actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSend}
          disabled={sending || !stats?.pending}
        >
          {sending ? "Sending…" : "Send next batch"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => refresh()}>
          Refresh stats
        </button>
      </div>

      {sent.length > 0 && (
        <div className="sent-list">
          <h3 style={{ fontSize: "0.95rem", color: "#9aa0a6", marginBottom: "0.5rem" }}>
            Recently sent
          </h3>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Sent by</th>
                <th>Sent at</th>
              </tr>
            </thead>
            <tbody>
              {sent.map((row) => (
                <tr key={row.email + row.sent_at}>
                  <td>{row.email}</td>
                  <td>{row.name ?? "—"}</td>
                  <td>{row.sender_label ?? "—"}</td>
                  <td>{new Date(row.sent_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
