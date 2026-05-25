import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { MailWorkerModal, type MailWorkerModalMode } from "../components/MailWorkerModal";
import {
  formatMailWorkerSenderLabel,
  SendBatchConfirmModal,
} from "../components/SendBatchConfirmModal";
import { UserLocationFilters } from "../components/UserLocationFilters";
import type {
  MailSendStatus,
  MailStats,
  MailWorkerListItem,
  MailSendLiveItem,
  SentMailItem,
  UserFilterOptions,
  UserFilters,
} from "../types";

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
  const [sendStatus, setSendStatus] = useState<MailSendStatus | null>(null);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const sendRunningRef = useRef(false);
  const wasSendRunningRef = useRef(false);
  const [filterOptions, setFilterOptions] = useState<UserFilterOptions>({
    scrape_countries: [],
    search_locations: [],
  });
  const [filters, setFilters] = useState<UserFilters>({});

  const activeWorker = workers.find((w) => w.is_active);

  const refresh = useCallback(async () => {
    const [s, list, workerList] = await Promise.all([
      api.getMailStats(filters),
      api.listSent(30),
      api.listMailWorkers(),
    ]);
    setStats(s);
    setSent(list);
    setWorkers(workerList);
  }, [filters]);

  useEffect(() => {
    api.getUserFilterOptions().then(setFilterOptions).catch(() => {});
    refresh().catch(() => {});
    api.getMailSendStatus().then(setSendStatus).catch(() => {});
  }, [refresh]);

  useEffect(() => {
    sendRunningRef.current = sendStatus?.running ?? false;
  }, [sendStatus?.running]);

  useEffect(() => {
    const poll = () =>
      api
        .getMailSendStatus()
        .then((s) => setSendStatus(s))
        .catch(() => {});

    poll();
    let timeoutId: ReturnType<typeof setTimeout>;
    const schedule = () => {
      poll();
      timeoutId = setTimeout(schedule, sendRunningRef.current ? 800 : 4000);
    };
    schedule();
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const running = sendStatus?.running ?? false;
    if (wasSendRunningRef.current && !running) {
      refresh().catch(() => {});
      if (sendStatus && !sendStatus.error) {
        setMessage({
          type: "ok",
          text: sendStatus.message || "Batch finished",
        });
      }
    }
    wasSendRunningRef.current = running;
  }, [sendStatus?.running, sendStatus?.message, sendStatus?.error, refresh]);

  useEffect(() => {
    if (!sendStatus) return;
    setStats((prev) =>
      prev
        ? { ...prev, sent: sendStatus.total_sent, pending: sendStatus.pending }
        : prev
    );
  }, [sendStatus?.total_sent, sendStatus?.pending, sendStatus?.running]);

  const handleFiltersChange = useCallback(
    (next: UserFilters) => {
      setFilters(next);
      Promise.all([api.getMailStats(next), api.listSent(30)])
        .then(([s, list]) => {
          setStats(s);
          setSent(list);
        })
        .catch(() => {});
    },
    []
  );

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

  async function handleSend(): Promise<boolean> {
    setSending(true);
    setMessage(null);
    try {
      const status = await api.startMailBatch(
        limit === "" ? undefined : Number(limit),
        filters
      );
      setSendStatus(status);
      setMessage({ type: "ok", text: status.message || "Sending started…" });
      return true;
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Send failed",
      });
      return false;
    } finally {
      setSending(false);
    }
  }

  const sendRunning = sendStatus?.running ?? false;

  const canSend =
    Boolean(activeWorker?.app_password_set) &&
    Boolean(activeWorker?.gmail_email) &&
    Boolean(stats?.pending) &&
    !sendRunning;

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
            No message settings yet. Click <strong>Register</strong> to add your
            name, Gmail, app password, subject, and content.
          </p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>First name</th>
                  <th>Last name</th>
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
                    <td>{w.first_name || "—"}</td>
                    <td>{w.last_name || "—"}</td>
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
            Active sender:{" "}
            <strong>
              {[activeWorker.first_name, activeWorker.last_name]
                .filter(Boolean)
                .join(" ") || activeWorker.gmail_email}
            </strong>{" "}
            ({activeWorker.gmail_email}, limit{" "}
            {activeWorker.sending_limit} per run)
          </p>
        )}
        <UserLocationFilters
          filters={filters}
          options={filterOptions}
          onFiltersChange={handleFiltersChange}
          disabled={sending || sendRunning}
        />
        <p className="field-hint" style={{ marginBottom: "1rem" }}>
          Mail list uses the filters above. <strong>Pending</strong>, <strong>Sent</strong>,
          and sent history are per active mail worker — the same email can be sent again
          by a different worker.
        </p>
        <MailSendStatusBox status={sendStatus} />

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="value">{stats.total}</div>
              <div className="label">Mail list (PostgreSQL)</div>
            </div>
            <div className="stat-card">
              <div className="value">{sendStatus?.total_sent ?? stats.sent}</div>
              <div className="label">Sent</div>
            </div>
            <div className="stat-card">
              <div className="value">{sendStatus?.pending ?? stats.pending}</div>
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
            onClick={() => setConfirmSendOpen(true)}
            disabled={sending || sendRunning || !canSend}
          >
            {sendRunning ? "Sending…" : sending ? "Starting…" : "Send next batch"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => refresh()}
            disabled={sendRunning}
          >
            Refresh
          </button>
        </div>

        <div className="panel panel--nested">
          <h3>
            Live send results
            {sendStatus?.running
              ? ` (${sendStatus.sent_this_run} sent, ${sendStatus.failed_this_run} failed)`
              : sendStatus && sendStatus.sent_this_run + sendStatus.failed_this_run > 0
                ? ` (last run: ${sendStatus.sent_this_run} sent)`
                : ""}
          </h3>
          <MailSendLiveFeed feed={sendStatus?.live_feed ?? []} running={sendRunning} />
        </div>
        {activeWorker && sent.length === 0 && (
          <p className="field-hint">
            No sent history for{" "}
            {[activeWorker.first_name, activeWorker.last_name].filter(Boolean).join(" ") ||
              activeWorker.gmail_email}{" "}
            yet.
          </p>
        )}
        {sent.length > 0 && (
          <div className="data-table-wrap sent-list">
            <table className="data-table">
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
                  <tr key={`${row.email}-${row.mail_worker_id ?? ""}-${row.sent_at}`}>
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

      {activeWorker && (
        <SendBatchConfirmModal
          open={confirmSendOpen}
          senderLabel={formatMailWorkerSenderLabel(
            activeWorker.first_name,
            activeWorker.last_name,
            activeWorker.gmail_email
          )}
          pendingCount={stats?.pending ?? 0}
          confirming={sending || sendRunning}
          onClose={() => setConfirmSendOpen(false)}
          onConfirm={async () => {
            const ok = await handleSend();
            if (ok) setConfirmSendOpen(false);
          }}
        />
      )}
    </div>
  );
}

function MailSendStatusBox({ status }: { status: MailSendStatus | null }) {
  if (!status) return null;

  const progress =
    status.batch_total > 0
      ? Math.round(
          ((status.sent_this_run + status.failed_this_run + status.skipped_this_run) /
            status.batch_total) *
            100
        )
      : 0;

  return (
    <div
      className={`scraper-status mail-send-status ${status.running ? "scraper-status--running" : ""}`}
      style={{ marginBottom: "1rem" }}
    >
      <div className="scraper-status__row">
        <span className={`scraper-status__badge ${status.running ? "is-running" : ""}`}>
          {status.running ? "Sending" : "Idle"}
        </span>
        <span className="scraper-status__message">{status.message || "—"}</span>
      </div>

      {status.running && status.batch_total > 0 && (
        <div className="scraper-status__progress">
          <div className="scraper-status__progress-label">
            Progress{" "}
            {status.sent_this_run + status.failed_this_run + status.skipped_this_run} /{" "}
            {status.batch_total} ({progress}%)
          </div>
          <div className="scraper-status__progress-bar">
            <div
              className="scraper-status__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status.current_email && status.running && (
        <p className="field-hint" style={{ margin: "0.5rem 0 0" }}>
          Current: <strong>{status.current_email}</strong>
        </p>
      )}

      {status.error && <p className="text-error">{status.error}</p>}
    </div>
  );
}

function MailSendLiveFeed({
  feed,
  running,
}: {
  feed: MailSendLiveItem[];
  running: boolean;
}) {
  if (feed.length === 0) {
    return (
      <p className="field-hint">
        {running
          ? "Sending — each success or failure will appear here in real time."
          : "No send results yet. Click Send next batch to start."}
      </p>
    );
  }

  return (
    <ol className="live-feed">
      {feed.map((item, index) => (
        <li
          key={`${item.email}-${item.sent_at}-${item.status}`}
          className={`live-feed__item live-feed__item--${item.status} ${
            index === 0 && running ? "live-feed__item--new" : ""
          }`}
        >
          <div className="live-feed__main">
            <strong>{item.email}</strong>
            {item.name && <span className="live-feed__name"> — {item.name}</span>}
            <span className={`mail-send-status-badge mail-send-status-badge--${item.status}`}>
              {item.status}
            </span>
          </div>
          <div className="live-feed__meta">
            {item.error && <span className="text-error">{item.error}</span>}
            <time dateTime={item.sent_at}>
              {new Date(item.sent_at).toLocaleTimeString()}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
