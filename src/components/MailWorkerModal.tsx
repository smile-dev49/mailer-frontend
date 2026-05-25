import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { PasswordInput } from "./PasswordInput";
import type { MailWorkerConfig, MailWorkerSavePayload } from "../types";

function useEscapeClose(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onClose]);
}

export type MailWorkerModalMode = "create" | "view";

type Props = {
  open: boolean;
  mode: MailWorkerModalMode;
  workerId: number | null;
  onClose: () => void;
  onSaved: () => void;
};

const emptyForm = {
  gmailEmail: "",
  appPassword: "",
  appPasswordSet: false,
  subject: "",
  content: "",
  sendingLimit: 10,
  sendDelaySeconds: 2,
  setActive: false,
};

export function MailWorkerModal({
  open,
  mode,
  workerId,
  onClose,
  onSaved,
}: Props) {
  const [editing, setEditing] = useState(mode === "create");
  const [loading, setLoading] = useState(false);
  const [gmailEmail, setGmailEmail] = useState(emptyForm.gmailEmail);
  const [appPassword, setAppPassword] = useState("");
  const [appPasswordSet, setAppPasswordSet] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sendingLimit, setSendingLimit] = useState(10);
  const [sendDelaySeconds, setSendDelaySeconds] = useState(2);
  const [setActive, setSetActive] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEscapeClose(open, onClose);

  useEffect(() => {
    if (!open) return;
    setEditing(mode === "create");
    setError(null);

    if (mode === "create") {
      setGmailEmail(emptyForm.gmailEmail);
      setAppPassword("");
      setAppPasswordSet(false);
      setSubject("");
      setContent("");
      setSendingLimit(10);
      setSendDelaySeconds(2);
      setSetActive(false);
      setIsActive(false);
      return;
    }

    if (workerId == null) return;

    setLoading(true);
    api
      .getMailWorkerById(workerId)
      .then((cfg: MailWorkerConfig) => {
        applyConfig(cfg);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  }, [open, mode, workerId]);

  function applyConfig(cfg: MailWorkerConfig) {
    setGmailEmail(cfg.gmail_email);
    setAppPasswordSet(cfg.app_password_set);
    setSubject(cfg.subject);
    setContent(cfg.content);
    setSendingLimit(cfg.sending_limit);
    setSendDelaySeconds(cfg.send_delay_seconds);
    setIsActive(cfg.is_active);
    setSetActive(cfg.is_active);
    setAppPassword("");
  }

  if (!open) return null;

  const isViewOnly = mode === "view" && !editing;
  const title =
    mode === "create"
      ? "Register message settings"
      : isViewOnly
        ? "View message settings"
        : "Edit message settings";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: MailWorkerSavePayload = {
      gmail_email: gmailEmail.trim(),
      app_password: appPassword.trim() || undefined,
      subject,
      content,
      sending_limit: sendingLimit,
      send_delay_seconds: sendDelaySeconds,
      set_active: setActive,
    };

    try {
      if (mode === "create") {
        await api.createMailWorker(payload);
      } else if (workerId != null) {
        await api.updateMailWorker(workerId, payload);
        if (setActive) {
          await api.activateMailWorker(workerId);
        }
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-labelledby="mail-worker-modal-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h3 id="mail-worker-modal-title">{title}</h3>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        {loading ? (
          <div className="modal__body">
            <p className="field-hint">Loading…</p>
          </div>
        ) : (
          <form className="modal__body" onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}

            {mode === "view" && isViewOnly && (
              <div className="modal__view-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
              </div>
            )}

            <div className="field">
              <label>Gmail address</label>
              {isViewOnly ? (
                <p className="modal__readonly">{gmailEmail || "—"}</p>
              ) : (
                <input
                  type="email"
                  required
                  placeholder="your@gmail.com"
                  value={gmailEmail}
                  onChange={(e) => setGmailEmail(e.target.value)}
                />
              )}
            </div>

            <div className="field">
              <label>Gmail App password</label>
              {isViewOnly ? (
                <p className="modal__readonly">
                  {appPasswordSet ? "•••• •••• •••• •••• (saved)" : "—"}
                </p>
              ) : (
                <PasswordInput
                  placeholder={
                    appPasswordSet
                      ? "xxxx xxxx xxxx xxxx (leave blank to keep saved)"
                      : "xxxx xxxx xxxx xxxx"
                  }
                  value={appPassword}
                  onChange={setAppPassword}
                />
              )}
            </div>

            <div className="row">
              <div className="field">
                <label>Emails per run</label>
                {isViewOnly ? (
                  <p className="modal__readonly">{sendingLimit}</p>
                ) : (
                  <input
                    type="number"
                    min={1}
                    required
                    value={sendingLimit}
                    onChange={(e) => setSendingLimit(Number(e.target.value))}
                  />
                )}
              </div>
              <div className="field">
                <label>Delay between emails (sec)</label>
                {isViewOnly ? (
                  <p className="modal__readonly">{sendDelaySeconds}</p>
                ) : (
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    required
                    value={sendDelaySeconds}
                    onChange={(e) => setSendDelaySeconds(Number(e.target.value))}
                  />
                )}
              </div>
            </div>

            {!isViewOnly && (
              <div className="field field--checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={setActive}
                    onChange={(e) => setSetActive(e.target.checked)}
                  />
                  Use for batch sending (active worker)
                </label>
              </div>
            )}

            {isViewOnly && isActive && (
              <p className="field-hint">This worker is active for batch sending.</p>
            )}

            <div className="field">
              <label>Subject</label>
              {isViewOnly ? (
                <pre className="settings-display__text">{subject || "—"}</pre>
              ) : (
                <textarea
                  rows={3}
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              )}
            </div>

            <div className="field">
              <label>Content</label>
              {isViewOnly ? (
                <pre className="settings-display__text settings-display__text--body">
                  {content || "—"}
                </pre>
              ) : (
                <textarea
                  rows={10}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              )}
            </div>

            {!isViewOnly && (
              <div className="modal__footer actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving…" : mode === "create" ? "Register" : "Save"}
                </button>
              </div>
            )}

            {isViewOnly && (
              <div className="modal__footer actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
