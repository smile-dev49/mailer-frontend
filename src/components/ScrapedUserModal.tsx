import { useEffect } from "react";
import type { GitHubUser } from "../types";

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

type Props = {
  open: boolean;
  user: GitHubUser | null;
  onClose: () => void;
};

export function ScrapedUserModal({ open, user, onClose }: Props) {
  useEscapeClose(open, onClose);

  if (!open || !user) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-labelledby="scraped-user-modal-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h3 id="scraped-user-modal-title">View scraped user</h3>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="modal__body">
          <dl className="settings-display__grid">
            <dt>Email</dt>
            <dd>{user.email}</dd>

            <dt>Name</dt>
            <dd>{user.name ?? "—"}</dd>

            <dt>Location</dt>
            <dd>{user.location ?? "—"}</dd>

            <dt>GitHub profile</dt>
            <dd>
              {user.html_url ? (
                <a href={user.html_url} target="_blank" rel="noreferrer">
                  {user.html_url}
                </a>
              ) : (
                "—"
              )}
            </dd>

            <dt>Scraped at</dt>
            <dd>
              {user.created_at
                ? new Date(user.created_at).toLocaleString()
                : "—"}
            </dd>

            <dt>Updated at</dt>
            <dd>
              {user.updated_at
                ? new Date(user.updated_at).toLocaleString()
                : "—"}
            </dd>
          </dl>
        </div>

        <div className="modal__footer actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {user.html_url && (
            <a
              href={user.html_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Open GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
