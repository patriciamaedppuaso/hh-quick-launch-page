import { useState } from "react";
import type { AnnouncementAttachment } from "../types";
import { Icon } from "../icons";
import { MAX_UPLOAD_BYTES, formatFileSize, newId } from "../utils";
import { deleteUploadedFile, uploadFile } from "../lib/uploads";

interface Props {
  attachments: AnnouncementAttachment[];
  onChange: (attachments: AnnouncementAttachment[]) => void;
}

export function AttachmentPicker({ attachments, onChange }: Props) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputId = `attach-${Math.random().toString(36).slice(2, 8)}`;

  async function handleFiles(fileList: FileList | null) {
    setError("");
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    const next = [...attachments];
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_UPLOAD_BYTES) {
        setError(`"${file.name}" is too large (max ${formatFileSize(MAX_UPLOAD_BYTES)}).`);
        continue;
      }
      try {
        const url = await uploadFile(file, "announcements");
        next.push({
          id: newId("attachment"),
          name: file.name,
          url,
          isImage: file.type.startsWith("image/"),
        });
      } catch {
        setError(`Couldn't upload "${file.name}". Try again.`);
      }
    }
    setUploading(false);
    onChange(next);
  }

  function removeAttachment(id: string) {
    const attachment = attachments.find((a) => a.id === id);
    onChange(attachments.filter((a) => a.id !== id));
    deleteUploadedFile(attachment?.url);
  }

  return (
    <div className="attachment-picker">
      {attachments.length > 0 && (
        <div className="attachment-list">
          {attachments.map((a) => (
            <div className="attachment-chip" key={a.id}>
              {a.isImage ? (
                <img src={a.url} alt="" className="attachment-thumb" />
              ) : (
                <span className="attachment-icon">
                  <Icon name="file" />
                </span>
              )}
              <span className="attachment-name">{a.name}</span>
              <button
                type="button"
                className="icon-btn-sm"
                aria-label={`Remove ${a.name}`}
                onClick={() => removeAttachment(a.id)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <label htmlFor={inputId} className={`file-picker-btn${uploading ? " file-picker-btn--uploading" : ""}`}>
        {uploading ? "Uploading…" : "+ Add files or images"}
        <input
          id={inputId}
          type="file"
          multiple
          disabled={uploading}
          className="file-picker-input"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
