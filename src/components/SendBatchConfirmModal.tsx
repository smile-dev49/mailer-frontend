import { useEffect } from "react";

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
  senderLabel: string;
  pendingCount: number;
  onConfirm: () => void;
  onClose: () => void;
  confirming: boolean;
};

export function SendBatchConfirmModal({
  open,
  senderLabel,
  pendingCount,
  onConfirm,
  onClose,
  confirming,
}: Props) {
  useEscapeClose(open && !confirming, onClose);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={confirming ? undefined : onClose}>
      <div
        className="modal modal--compact"
        role="dialog"
        aria-labelledby="send-batch-confirm-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h3 id="send-batch-confirm-title">Confirm send</h3>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            disabled={confirming}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="modal__body">
          <p className="modal__confirm-text">
            Do you want to send with <strong>{senderLabel}</strong>?
          </p>
          {pendingCount > 0 && (
            <p className="field-hint">
              Up to {pendingCount} pending recipient{pendingCount === 1 ? "" : "s"} will be
              considered for this batch (subject to your per-run limit).
            </p>
          )}
        </div>

        <div className="modal__footer actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={confirming}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? "Sending…" : "Yes, send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function formatMailWorkerSenderLabel(
  firstName: string,
  lastName: string,
  gmailEmail: string
): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (name) return `${name} (${gmailEmail})`;
  return gmailEmail;
}
