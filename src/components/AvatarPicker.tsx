import { useState } from "react";
import { MAX_UPLOAD_BYTES, formatFileSize, initialOf } from "../utils";
import { uploadFile } from "../lib/uploads";

interface Props {
  name: string;
  avatar: string;
  onChange: (url: string) => void;
  onClear: () => void;
}

export function AvatarPicker({ name, avatar, onChange, onClear }: Props) {
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputId = `avatar-${Math.random().toString(36).slice(2, 8)}`;

  async function handleFile(file: File | null) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`Image is too large (max ${formatFileSize(MAX_UPLOAD_BYTES)}).`);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile(file, "avatars");
      onChange(url);
    } catch {
      setError("Couldn't upload that image. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="avatar-picker">
      <div className="avatar-preview">
        {avatar ? <img src={avatar} alt="" /> : <span className="avatar-preview-fallback">{initialOf(name || "?")}</span>}
      </div>
      <div className="avatar-picker-actions">
        <label htmlFor={inputId} className="btn-secondary-sm avatar-picker-btn">
          {uploading ? "Uploading…" : avatar ? "Change photo" : "Upload photo"}
          <input
            id={inputId}
            type="file"
            accept="image/*"
            disabled={uploading}
            className="file-picker-input"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {avatar && (
          <button type="button" className="btn-secondary-sm" onClick={onClear}>
            Remove
          </button>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
