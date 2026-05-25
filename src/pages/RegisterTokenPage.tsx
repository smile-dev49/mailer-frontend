import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { PasswordInput } from "../components/PasswordInput";
import type { TokenItem } from "../types";

export function RegisterTokenPage() {
  const [token, setToken] = useState("");
  const [label, setLabel] = useState("default");
  const [gmailEmail, setGmailEmail] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  async function loadTokens() {
    const data = await api.getTokens();
    setHasToken(data.has_active_token);
    setTokens(data.tokens);
    if (data.active_gmail_email && !gmailEmail) {
      setGmailEmail(data.active_gmail_email);
    }
  }

  useEffect(() => {
    loadTokens().catch(() => {});
  }, []);

  const canSubmit = token.trim() && gmailEmail.trim();

  async function saveToken(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setMessage(null);
    try {
      await api.saveToken({
        access_token: token.trim(),
        gmail_email: gmailEmail.trim(),
        label: label.trim() || "default",
      });
      setToken("");
      setMessage({
        type: "ok",
        text: "GitHub token and Gmail address saved (App password stays in backend/.env)",
      });
      await loadTokens();
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
    <div className="page">
      <header className="page-header">
        <h2>Register Token</h2>
        <p>
          GitHub token and Gmail address are required. Gmail App password is only in{" "}
          <code>backend/.env</code> (not stored in the database).
        </p>
      </header>

      {message && (
        <div className={`alert alert-${message.type === "ok" ? "success" : "error"}`}>
          {message.text}
        </div>
      )}

      <div className="panel">
        <h3>Register credentials</h3>
        <form onSubmit={saveToken}>
          <div className="field">
            <label>Label (optional)</label>
            <input
              type="text"
              placeholder="default"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="field">
            <label>
              GitHub personal access token <span className="required">*</span>
            </label>
            <PasswordInput
              id="github-token"
              placeholder={hasToken ? "ghp_... (enter new to replace active)" : "ghp_..."}
              value={token}
              onChange={setToken}
              required
            />
            <p className="field-hint">
              <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">
                github.com/settings/tokens
              </a>
            </p>
          </div>

          <div className="field">
            <label>
              Gmail address <span className="required">*</span>
            </label>
            <input
              type="email"
              placeholder="you@gmail.com"
              value={gmailEmail}
              onChange={(e) => setGmailEmail(e.target.value)}
              required
            />
            <p className="field-hint">
              Saved in PostgreSQL <code>tokens.gmail_email</code>. App password →{" "}
              <code>GOOGLE_PASSWORD</code> in <code>backend/.env</code>
            </p>
          </div>

          <div className="actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !canSubmit}
            >
              {saving ? "Saving…" : "Save GitHub token & Gmail"}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h3>Saved tokens</h3>
        {tokens.length === 0 ? (
          <p className="field-hint">No tokens registered yet.</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>GitHub token</th>
                  <th>Gmail</th>
                  <th>Active</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.id}>
                    <td>{t.label}</td>
                    <td>
                      <code>{t.access_token_masked}</code>
                    </td>
                    <td>{t.gmail_email || "—"}</td>
                    <td>{t.is_active ? "Yes" : "No"}</td>
                    <td>{new Date(t.updated_at).toLocaleString()}</td>
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
