import { useEffect, useState } from "react";
import type { AppTile } from "../types";
import { MAX_UPLOAD_BYTES, brandLogoSources, formatFileSize, initialOf, newId, normalizeUrl, readFileAsDataUrl } from "../utils";
import { FilePicker } from "./FilePicker";

interface Props {
  onSave: (app: AppTile) => void;
  onCancel: () => void;
}

type Source = "link" | "file";

export function AddAppForm({ onSave, onCancel }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"link" | "list">("link");

  const [source, setSource] = useState<Source>("link");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileDataUrl, setFileDataUrl] = useState("");
  const [fileError, setFileError] = useState("");

  const [logoStep, setLogoStep] = useState(0);
  useEffect(() => {
    setLogoStep(0);
  }, [url]);
  const logoSources = source === "link" && url.trim() ? brandLogoSources(url) : [];

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
    const trimmedDescription = description.trim();

    if (type === "link") {
      if (source === "file") {
        if (!fileDataUrl) return;
        onSave({
          id: newId("app"),
          type: "link",
          name: trimmedName,
          description: trimmedDescription || undefined,
          url: fileDataUrl,
          isFile: true,
          fileName,
          initial: initialOf(trimmedName),
        });
        return;
      }
      const trimmedUrl = url.trim();
      if (!trimmedUrl) return;
      onSave({
        id: newId("app"),
        type: "link",
        name: trimmedName,
        description: trimmedDescription || undefined,
        url: normalizeUrl(trimmedUrl),
        initial: initialOf(trimmedName),
        useBrandLogo: true,
      });
      return;
    }

    onSave({
      id: newId("app"),
      type: "list",
      name: trimmedName,
      description: trimmedDescription || undefined,
      items: [],
      initial: initialOf(trimmedName),
    });
  }

  return (
    <div className="form-card">
      <div className="form-row">
        <label htmlFor="fName">Name</label>
        <input
          id="fName"
          type="text"
          placeholder="e.g. Discord or Contracts"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-row">
        <label htmlFor="fDesc">Description (optional)</label>
        <input
          id="fDesc"
          type="text"
          placeholder="What is this for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form-row">
        <label>Type</label>
        <div className="type-toggle" role="group" aria-label="Type">
          <button
            type="button"
            className={`type-btn${type === "link" ? " active" : ""}`}
            onClick={() => setType("link")}
          >
            Link
          </button>
          <button
            type="button"
            className={`type-btn${type === "list" ? " active" : ""}`}
            onClick={() => setType("list")}
          >
            List of items
          </button>
        </div>
      </div>

      {type === "link" ? (
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
            <>
              <div className="url-field">
                <input
                  type="text"
                  placeholder="e.g. discord.com/app"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                {url.trim() && logoStep < logoSources.length && (
                  <span className="logo-preview" title="Detected logo">
                    <img src={logoSources[logoStep]} alt="" onError={() => setLogoStep((s) => s + 1)} />
                  </span>
                )}
              </div>
              <p className="field-hint">We'll automatically use this site's logo as the icon.</p>
            </>
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
      ) : (
        <p className="form-hint">You'll add items (and folders, if you want them) from inside the app after creating it.</p>
      )}

      <div className="form-buttons">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleSave}>
          Add
        </button>
      </div>
    </div>
  );
}
