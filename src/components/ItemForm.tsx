import { useState } from "react";
import type { ListItem } from "../types";
import { MAX_UPLOAD_BYTES, formatFileSize, newId, normalizeUrl, readFileAsDataUrl } from "../utils";
import { FilePicker } from "./FilePicker";

interface Props {
  initial?: ListItem;
  onSave: (item: ListItem) => void;
  onCancel: () => void;
}

type Source = "link" | "file";

export function ItemForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [source, setSource] = useState<Source>(initial?.isFile ? "file" : "link");
  const [url, setUrl] = useState(initial?.isFile ? "" : (initial?.url ?? ""));
  const [fileName, setFileName] = useState(initial?.isFile ? (initial?.fileName ?? "") : "");
  const [fileSize, setFileSize] = useState(0);
  const [fileDataUrl, setFileDataUrl] = useState(initial?.isFile ? (initial?.url ?? "") : "");
  const [fileError, setFileError] = useState("");

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
    if (!trimmedName) return;
    const trimmedDesc = description.trim();

    if (source === "file") {
      if (!fileDataUrl) return;
      onSave({
        id: initial?.id ?? newId("item"),
        name: trimmedName,
        description: trimmedDesc || undefined,
        url: fileDataUrl,
        isFile: true,
        fileName,
      });
      return;
    }

    onSave({
      id: initial?.id ?? newId("item"),
      name: trimmedName,
      description: trimmedDesc || undefined,
      url: url.trim() ? normalizeUrl(url.trim()) : "",
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
