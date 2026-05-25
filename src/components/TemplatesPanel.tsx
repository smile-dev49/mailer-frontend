import { useEffect, useState } from "react";
import { api } from "../api/client";

export function TemplatesPanel() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState<"subject" | "content" | null>(null);

  useEffect(() => {
    Promise.all([api.getSubject(), api.getContent()]).then(([s, c]) => {
      setSubject(s.content);
      setContent(c.content);
    });
  }, []);

  async function saveSubject() {
    setSaving("subject");
    setMessage(null);
    try {
      await api.saveSubject(subject);
      setMessage({ type: "ok", text: "Subject.txt saved" });
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(null);
    }
  }

  async function saveContent() {
    setSaving("content");
    setMessage(null);
    try {
      await api.saveContent(content);
      setMessage({ type: "ok", text: "Content.txt saved" });
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="panel">
      <h2>Email templates</h2>
      {message && (
        <div className={`alert alert-${message.type === "ok" ? "success" : "error"}`}>
          {message.text}
        </div>
      )}

      <div className="field">
        <label>Subject.txt</label>
        <textarea
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject: Your subject line"
          rows={3}
        />
        <p className="field-hint">
          Use a line starting with &quot;Subject:&quot; or plain text. Saved to Subject.txt
        </p>
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

      <div className="field" style={{ marginTop: "1.5rem" }}>
        <label>Content.txt</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Hello, ..."
          rows={14}
        />
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
    </div>
  );
}
