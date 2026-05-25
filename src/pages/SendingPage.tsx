import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { MailWorkerModal, type MailWorkerModalMode } from "../components/MailWorkerModal";
import type { MailSendResult, MailStats, MailWorkerListItem, SentMailItem } from "../types";

export function SendingPage() {
  const [workers, setWorkers] = useState<MailWorkerListItem[]>([]);
  const [stats, setStats] = useState<MailStats | null>(null);
  const [sent, setSent] = useState<SentMailItem[]>([]);
  const [limit, setLimit] = useState<number | "">("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<MailWorkerModalMode>("create");
  const [modalWorkerId, setModalWorkerId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const activeWorker = workers.find((w) => w.is_active);

  const refresh = useCallback(async () => {
    const [s, list, workerList] = await Promise.all([
      api.getMailStats(),
      api.listSent(30),
      api.listMailWorkers(),
    ]);
    setStats(s);
    setSent(list);
    setWorkers(workerList);
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  function openRegister() {
    setModalMode("create");
    setModalWorkerId(null);
    setModalOpen(true);
  }

  function openView(workerId: number) {
    setModalMode("view");
    setModalWorkerId(workerId);
    setModalOpen(true);
  }

  async function handleSetActive(workerId: number) {
    setMessage(null);
    try {
      await api.activateMailWorker(workerId);
      setMessage({ type: "ok", text: "Active mail worker updated" });
      await refresh();
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Failed to activate",
      });
    }
  }

  async function handleSend() {
    setSending(true);
    setMessage(null);
    try {
      const result: MailSendResult = await api.sendMailBatch(
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

  const canSend =
    Boolean(activeWorker?.app_password_set) &&
    Boolean(activeWorker?.gmail_email) &&
    Boolean(stats?.pending);

  return (
    <div className="page">
      <header className="page-header">
        <h2>Message Setting</h2>
        <p>
          Register multiple Gmail message profiles. View or edit each row. Batch send
          uses the active worker.
        </p>
      </header>

      {message && (
        <div className={`alert alert-${message.type === "ok" ? "success" : "error"}`}>
          {message.text}
        </div>
      )}

      <div className="panel">
        <div className="panel__toolbar">
          <h3>Registered settings</h3>
          <button type="button" className="btn btn-primary" onClick={openRegister}>
            Register
          </button>
        </div>

        {workers.length === 0 ? (
          <p className="field-hint">
            No message settings yet. Click <strong>Register</strong> to add Gmail,
            app password, subject, and content.
          </p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Gmail</th>
                  <th>Subject</th>
                  <th>Per run</th>
                  <th>Delay (s)</th>
                  <th>Active</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w.id} className={w.is_active ? "row-active" : undefined}>
                    <td>{w.gmail_email}</td>
                    <td className="cell-truncate" title={w.subject_preview}>
                      {w.subject_preview || "—"}
                    </td>
                    <td>{w.sending_limit}</td>
                    <td>{w.send_delay_seconds}</td>
                    <td>
                      {w.is_active ? (
                        <span className="badge badge-active">Active</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-link"
                          onClick={() => handleSetActive(w.id)}
                        >
                          Set active
                        </button>
                      )}
                    </td>
                    <td>{new Date(w.updated_at).toLocaleString()}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openView(w.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MailWorkerModal
        open={modalOpen}
        mode={modalMode}
        workerId={modalWorkerId}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          refresh().catch(() => {});
          setMessage({ type: "ok", text: "Message settings saved" });
        }}
      />

      <div className="panel">
        <h3>Send batch</h3>
        {!activeWorker && (
          <div className="alert alert-info" style={{ marginBottom: "1rem" }}>
            Register a mail worker and set one as active before sending.
          </div>
        )}
        {activeWorker && (
          <p className="field-hint" style={{ marginBottom: "1rem" }}>
            Active sender: <strong>{activeWorker.gmail_email}</strong> (limit{" "}
            {activeWorker.sending_limit} per run)
          </p>
        )}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="value">{stats.total}</div>
              <div className="label">Mail list (PostgreSQL)</div>
            </div>
            <div className="stat-card">
              <div className="value">{stats.sent}</div>
              <div className="label">Sent</div>
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
            placeholder={`Default: ${activeWorker?.sending_limit ?? 10}`}
            value={limit}
            onChange={(e) => setLimit(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSend}
            disabled={sending || !canSend}
          >
            {sending ? "Sending…" : "Send next batch"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => refresh()}>
            Refresh
          </button>
        </div>
        {sent.length > 0 && (
          <div className="data-table-wrap sent-list">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Sent at</th>
                </tr>
              </thead>
              <tbody>
                {sent.map((row) => (
                  <tr key={row.email + row.sent_at}>
                    <td>{row.email}</td>
                    <td>{row.name ?? "—"}</td>
                    <td>{new Date(row.sent_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
