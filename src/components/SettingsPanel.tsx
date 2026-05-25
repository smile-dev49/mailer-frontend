import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Settings } from "../types";

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [githubToken, setGithubToken] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [googlePassword, setGooglePassword] = useState("");
  const [sendingLimit, setSendingLimit] = useState(10);
  const [sendDelay, setSendDelay] = useState(2);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s);
      setGoogleEmail(s.google_email);
      setSendingLimit(s.sending_limit);
      setSendDelay(s.send_delay_seconds);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const body: Record<string, unknown> = {
        google_email: googleEmail,
        sending_limit: sendingLimit,
        send_delay_seconds: sendDelay,
      };
      if (githubToken.trim()) body.github_token = githubToken;
      if (googlePassword.trim()) body.google_password = googlePassword;

      const updated = await api.saveSettings(body);
      setSettings(updated);
      setGithubToken("");
      setGooglePassword("");
      setMessage({ type: "ok", text: "Settings saved to .env" });
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel">
      <h2>Credentials & limits</h2>
      {message && (
        <div className={`alert alert-${message.type === "ok" ? "success" : "error"}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>GitHub token</label>
          <input
            type="password"
            placeholder={
              settings?.github_token_set ? "•••••••• (leave blank to keep)" : "ghp_..."
            }
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            autoComplete="off"
          />
          <p className="field-hint">Used by the scraper. Saved as GITHUB_TOKEN in .env</p>
        </div>

        <div className="field">
          <label>Gmail address</label>
          <input
            type="email"
            placeholder="you@gmail.com"
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
          <p className="field-hint">
            Not your Gmail login password — create at Google Account → App passwords
          </p>
        </div>

        <div className="row">
          <div className="field">
            <label>Emails per run (SENDING_LIMIT_TO_SET)</label>
            <input
              type="number"
              min={1}
              value={sendingLimit}
              onChange={(e) => setSendingLimit(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Delay between emails (seconds)</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={sendDelay}
              onChange={(e) => setSendDelay(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
