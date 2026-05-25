import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { MailSendResult, MailSettings, MailStats, SentMailItem } from "../types";

export function SendingPage() {
  const [settings, setSettings] = useState<MailSettings | null>(null);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googlePassword, setGooglePassword] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [stats, setStats] = useState<MailStats | null>(null);
  const [sent, setSent] = useState<SentMailItem[]>([]);
  const [limit, setLimit] = useState<number | "">("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    const [s, list, st] = await Promise.all([
      api.getMailStats(),
      api.listSent(30),
      api.getMailSettings(),
    ]);
    setStats(s);
    setSent(list);
    setSettings(st);
    setGoogleEmail(st.google_email);
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
    Promise.all([api.getSubject(), api.getContent()]).then(([sub, body]) => {
      setSubject(sub.content);
      setContent(body.content);
    });
  }, [refresh]);

  async function saveGmail(e: FormEvent) {
    e.preventDefault();
    setSaving("gmail");
    setMessage(null);
    try {
      const body: Record<string, unknown> = { google_email: googleEmail };
      if (googlePassword.trim()) body.google_password = googlePassword;
      if (settings) {
        body.sending_limit = settings.sending_limit;
        body.send_delay_seconds = settings.send_delay_seconds;
      }
      const updated = await api.saveMailSettings(body);
      setSettings(updated);
      setGooglePassword("");
      setMessage({ type: "ok", text: "Gmail settings saved to backend/.env" });
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(null);
    }
  }

  async function saveLimits(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving("limits");
    try {
      const updated = await api.saveMailSettings({
        sending_limit: settings.sending_limit,
        send_delay_seconds: settings.send_delay_seconds,
      });
      setSettings(updated);
      setMessage({ type: "ok", text: "Send limits updated" });
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(null);
    }
  }

  async function saveSubject() {
    setSaving("subject");
    try {
      await api.saveSubject(subject);
      setMessage({ type: "ok", text: "Subject.txt saved" });
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSaving(null);
    }
  }

  async function saveContent() {
    setSaving("content");
    try {
      await api.saveContent(content);
      setMessage({ type: "ok", text: "Content.txt saved" });
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSaving(null);
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

  return (
    <div className="page">
      <header className="page-header">
        <h2>Sending Message</h2>
        <p>Gmail credentials, templates, and batch send</p>
      </header>

      {message && (
        <div className={`alert alert-${message.type === "ok" ? "success" : "error"}`}>
          {message.text}
        </div>
      )}

      <div className="panel">
        <h3>Gmail (App password)</h3>
        <form onSubmit={saveGmail}>
          <div className="field">
            <label>Gmail address</label>
            <input
              type="email"
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Google App password</label>
            <input
              type="password"
              placeholder={
                settings?.google_password_set
                  ? "•••• •••• •••• •••• (leave blank to keep)"
                  : "xxxx xxxx xxxx xxxx"
              }
              value={googlePassword}
              onChange={(e) => setGooglePassword(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={saving === "gmail"}>
              {saving === "gmail" ? "Saving…" : "Save Gmail"}
            </button>
          </div>
        </form>
      </div>

      {settings && (
        <div className="panel">
          <h3>Batch limits</h3>
          <form onSubmit={saveLimits}>
            <div className="row">
              <div className="field">
                <label>Emails per run</label>
                <input
                  type="number"
                  min={1}
                  value={settings.sending_limit}
                  onChange={(e) =>
                    setSettings({ ...settings, sending_limit: Number(e.target.value) })
                  }
                />
              </div>
              <div className="field">
                <label>Delay between emails (sec)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={settings.send_delay_seconds}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      send_delay_seconds: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="actions">
              <button type="submit" className="btn btn-secondary" disabled={saving === "limits"}>
                {saving === "limits" ? "Saving…" : "Save limits"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <h3>Subject.txt</h3>
        <div className="field">
          <textarea rows={3} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={saveSubject}
            disabled={saving === "subject"}
          >
            {saving === "subject" ? "Saving…" : "Save subject"}
          </button>
        </div>
      </div>

      <div className="panel">
        <h3>Content.txt</h3>
        <div className="field">
          <textarea rows={12} value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={saveContent}
            disabled={saving === "content"}
          >
            {saving === "content" ? "Saving…" : "Save content"}
          </button>
        </div>
      </div>

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
            placeholder={`Default: ${settings?.sending_limit ?? 10}`}
            value={limit}
            onChange={(e) => setLimit(e.target.value === "" ? "" : Number(e.target.value))}
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
