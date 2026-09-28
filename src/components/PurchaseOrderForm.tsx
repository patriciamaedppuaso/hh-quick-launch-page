import { useState } from "react";
import type { PurchaseOrderRecord } from "../types";
import { MAX_UPLOAD_BYTES, formatFileSize, newId, normalizeUrl, readFileAsDataUrl } from "../utils";
import { FilePicker } from "./FilePicker";

interface Props {
  initial?: PurchaseOrderRecord;
  folderOptions?: string[];
  defaultFolder?: string;
  onSave: (record: PurchaseOrderRecord) => void;
  onCancel: () => void;
}

type Source = "link" | "file";

export function PurchaseOrderForm({ initial, folderOptions, defaultFolder, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [folder, setFolder] = useState(initial?.folder ?? defaultFolder ?? "");
  const [status, setStatus] = useState<PurchaseOrderRecord["status"]>(initial?.status ?? "unpaid");
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

    if (source === "file") {
      if (!fileDataUrl) {
        setError("Upload a file, or switch the source to Link.");
        return;
      }
      setError("");
      onSave({
        id: initial?.id ?? newId("po"),
        folder: folder || undefined,
        name: trimmedName,
        url: fileDataUrl,
        isFile: true,
        fileName,
        status,
      });
      return;
    }

    setError("");
    onSave({
      id: initial?.id ?? newId("po"),
      folder: folder || undefined,
      name: trimmedName,
      url: url.trim() ? normalizeUrl(url.trim()) : undefined,
      isFile: false,
      fileName: undefined,
      status,
    });
  }

  return (
    <div className="form-card">
      {folderOptions && folderOptions.length > 0 && (
        <div className="form-row">
          <label htmlFor="poFolder">Folder</label>
          <select id="poFolder" value={folder} onChange={(e) => setFolder(e.target.value)}>
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
        <label htmlFor="poName">Name</label>
        <input
          id="poName"
          type="text"
          placeholder="e.g. Vendor name or PO number"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-row">
        <label>Invoice</label>
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
          <input type="text" placeholder="Link (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
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

      <div className="form-row">
        <label>Status</label>
        <div className="type-toggle" role="group" aria-label="Status">
          <button
            type="button"
            className={`type-btn${status === "unpaid" ? " active" : ""}`}
            onClick={() => setStatus("unpaid")}
          >
            Unpaid
          </button>
          <button
            type="button"
            className={`type-btn${status === "paid" ? " active" : ""}`}
            onClick={() => setStatus("paid")}
          >
            Paid
          </button>
        </div>
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
