import { useState } from "react";
import type { AnnouncementAttachment, AnnouncementRecord } from "../types";
import { newId, todayIso } from "../utils";
import { AttachmentPicker } from "./AttachmentPicker";

interface Props {
  initial?: AnnouncementRecord;
  onSave: (record: AnnouncementRecord) => void;
  onCancel: () => void;
}

export function AnnouncementForm({ initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [message, setMessage] = useState(initial?.message ?? "");
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>(initial?.attachments ?? []);
  const [error, setError] = useState("");

  function handleSave() {
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }
    if (!trimmedMessage) {
      setError("Message is required.");
      return;
    }
    setError("");
    onSave({
      id: initial?.id ?? newId("announcement"),
      title: trimmedTitle,
      message: trimmedMessage,
      date: date || todayIso(),
      author: author.trim() || undefined,
      attachments: attachments.length ? attachments : undefined,
    });
  }

  return (
    <div className="form-card">
      <div className="form-row">
        <label htmlFor="aTitle">Title</label>
        <input
          id="aTitle"
          type="text"
          placeholder="What's the headline?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="aMessage">Message</label>
        <textarea
          id="aMessage"
          rows={4}
          placeholder="Details for the team"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="aDate">Date</label>
        <input id="aDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="aAuthor">Posted by (optional)</label>
        <input
          id="aAuthor"
          type="text"
          placeholder="Name"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label>Attachments (optional)</label>
        <AttachmentPicker attachments={attachments} onChange={setAttachments} />
      </div>
      {error && <p className="field-error">{error}</p>}

      <div className="form-buttons">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleSave}>
          {initial ? "Save" : "Post"}
        </button>
      </div>
    </div>
  );
}
