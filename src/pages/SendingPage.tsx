import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { PasswordInput } from "../components/PasswordInput";
import type { MailSendResult, MailStats, MailWorkerConfig, SentMailItem } from "../types";

export function SendingPage() {
  const [gmailEmail, setGmailEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [appPasswordSet, setAppPasswordSet] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sendingLimit, setSendingLimit] = useState(10);
  const [sendDelaySeconds, setSendDelaySeconds] = useState(2);
  const [stats, setStats] = useState<MailStats | null>(null);
  const [sent, setSent] = useState<SentMailItem[]>([]);
  const [limit, setLimit] = useState<number | "">("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const applyConfig = useCallback((cfg: MailWorkerConfig) => {
    setGmailEmail(cfg.gmail_email);
    setAppPasswordSet(cfg.app_password_set);
    setSubject(cfg.subject);
    setContent(cfg.content);
    setSendingLimit(cfg.sending_limit);
    setSendDelaySeconds(cfg.send_delay_seconds);
  }, []);

  const refresh = useCallback(async () => {
    const [s, list, worker] = await Promise.all([
      api.getMailStats(),
      api.listSent(30),
      api.getMailWorker(),
    ]);
    setStats(s);
    setSent(list);
    applyConfig(worker);
  }, [applyConfig]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  async function handleSaveAll(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.saveMailWorker({
        gmail_email: gmailEmail.trim(),
        app_password: appPassword.trim() || undefined,
        subject,
        content,
        sending_limit: sendingLimit,
        send_delay_seconds: sendDelaySeconds,
      });
      applyConfig(updated);
      setAppPassword("");
      setMessage({ type: "ok", text: "Mail worker saved to database" });
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(false);
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
    Boolean(gmailEmail.trim()) &&
    appPasswordSet &&
    Boolean(subject.trim()) &&
    Boolean(content.trim()) &&
    Boolean(stats?.pending);

  return (
    <div className="page">
      <header className="page-header">
        <h2>Sending Message</h2>
        <p>
          Configure the Gmail mail worker (separate from GitHub tokens). One Save stores
          everything in PostgreSQL.
        </p>
      </header>

      {message && (
        <div className={`alert alert-${message.type === "ok" ? "success" : "error"}`}>
          {message.text}
        </div>
      )}

      <form className="panel" onSubmit={handleSaveAll}>
        <h3>Mail worker settings</h3>

        <div className="field">
          <label>Gmail address</label>
          <input
            type="email"
            required
            placeholder="your@gmail.com"
            value={gmailEmail}
            onChange={(e) => setGmailEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Gmail App password</label>
          <PasswordInput
            placeholder={
              appPasswordSet
                ? "xxxx xxxx xxxx xxxx (leave blank to keep saved)"
                : "xxxx xxxx xxxx xxxx"
            }
            value={appPassword}
            onChange={setAppPassword}
          />
          <p className="field-hint">
            Stored in the database with this Gmail address. Not linked to Register Token.
          </p>
        </div>

        <div className="row">
          <div className="field">
            <label>Emails per run</label>
            <input
              type="number"
              min={1}
              required
              value={sendingLimit}
              onChange={(e) => setSendingLimit(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Delay between emails (sec)</label>
            <input
              type="number"
              min={0}
              step={0.5}
              required
              value={sendDelaySeconds}
              onChange={(e) => setSendDelaySeconds(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="field">
          <label>Subject</label>
          <textarea
            rows={3}
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Content</label>
          <textarea
            rows={12}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save all"}
          </button>
        </div>
      </form>

      <div className="panel">
        <h3>Send batch</h3>
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
            placeholder={`Default: ${sendingLimit}`}
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
