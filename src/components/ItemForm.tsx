import { useState } from "react";
import type { ListItem } from "../types";
import { MAX_UPLOAD_BYTES, formatFileSize, newId, normalizeUrl, readFileAsDataUrl, todayIso } from "../utils";
import { FilePicker } from "./FilePicker";

interface Props {
  initial?: ListItem;
  folderOptions?: string[];
  defaultFolder?: string;
  onSave: (item: ListItem) => void;
  onCancel: () => void;
}

type Source = "link" | "file";

export function ItemForm({ initial, folderOptions, defaultFolder, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [folder, setFolder] = useState(initial?.folder ?? defaultFolder ?? "");
  const [expiresOn, setExpiresOn] = useState(initial?.expiresOn ?? "");
  const [source, setSource] = useState<Source>(initial?.isFile ? "file" : "link");
  const [url, setUrl] = useState(initial?.isFile ? "" : (initial?.url ?? ""));
  const [fileName, setFileName] = useState(initial?.isFile ? (initial?.fileName ?? "") : "");
  const [fileSize, setFileSize] = useState(0);
  const [fileDataUrl, setFileDataUrl] = useState(initial?.isFile ? (initial?.url ?? "") : "");
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");

  async function handleFileChange(file: File | null) {
    setFileError("");
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setFileError(`File is too large (max ${formatFileSize(MAX_UPLOAD_BYTES)}).`);
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFileDataUrl(dataUrl);
      setFileName(file.name);
      setFileSize(file.size);
    } catch {
      setFileError("Couldn't read that file. Try a different one.");
    }
  }

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    const trimmedDesc = description.trim();

    if (source === "file") {
      if (!fileDataUrl) {
        setError("Upload a file, or switch the source to Link.");
        return;
      }
      setError("");
      onSave({
        id: initial?.id ?? newId("item"),
        name: trimmedName,
        description: trimmedDesc || undefined,
        url: fileDataUrl,
        isFile: true,
        fileName,
        expiresOn: expiresOn || undefined,
        updatedAt: todayIso(),
        folder: folder || undefined,
      });
      return;
    }

    setError("");
    onSave({
      id: initial?.id ?? newId("item"),
      name: trimmedName,
      description: trimmedDesc || undefined,
      url: url.trim() ? normalizeUrl(url.trim()) : "",
      expiresOn: expiresOn || undefined,
      updatedAt: todayIso(),
      folder: folder || undefined,
    });
  }

  return (
    <div className="form-card">
      <div className="form-row">
        <label htmlFor="iName">Name</label>
        <input
          id="iName"
          type="text"
          placeholder="Item name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-row">
        <label htmlFor="iDesc">Description (optional)</label>
        <input
          id="iDesc"
          type="text"
          placeholder="What is this?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {folderOptions && (
        <div className="form-row">
          <label htmlFor="iFolder">Folder</label>
          <select id="iFolder" value={folder} onChange={(e) => setFolder(e.target.value)}>
            <option value="">No folder</option>
            {folderOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-row">
        <label htmlFor="iExpires">Expires on (optional)</label>
        <input id="iExpires" type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
      </div>

      <div className="form-row">
        <label>Source</label>
        <div className="type-toggle" role="group" aria-label="Source">
          <button
            type="button"
            className={`type-btn${source === "link" ? " active" : ""}`}
            onClick={() => setSource("link")}
          >
            Link
          </button>
          <button
            type="button"
            className={`type-btn${source === "file" ? " active" : ""}`}
            onClick={() => setSource("file")}
          >
            Upload file
          </button>
        </div>

        {source === "link" ? (
          <input
            type="text"
            placeholder="Link (optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        ) : (
          <FilePicker
            fileName={fileName}
            fileSize={fileSize}
            error={fileError}
            onChange={handleFileChange}
            onClear={() => {
              setFileName("");
              setFileSize(0);
              setFileDataUrl("");
              setFileError("");
            }}
          />
        )}
      </div>

      {error && <p className="field-error">{error}</p>}

      <div className="form-buttons">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleSave}>
          {initial ? "Save" : "Add"}
        </button>
      </div>
    </div>
  );
}
