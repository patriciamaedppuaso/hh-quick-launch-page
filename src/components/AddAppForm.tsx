import { useEffect, useState } from "react";
import type { AppTile, ListItem } from "../types";
import { MAX_UPLOAD_BYTES, brandLogoSources, formatFileSize, initialOf, newId, normalizeUrl, readFileAsDataUrl } from "../utils";
import { FilePicker } from "./FilePicker";

interface Props {
  onSave: (app: AppTile) => void;
  onCancel: () => void;
}

type Source = "link" | "file";

interface DraftItem {
  id: string;
  name: string;
  description: string;
  source: Source;
  url: string;
  fileName: string;
  fileSize: number;
  fileError: string;
}

function freshItem(): DraftItem {
  return {
    id: newId("item"),
    name: "",
    description: "",
    source: "link",
    url: "",
    fileName: "",
    fileSize: 0,
    fileError: "",
  };
}

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

  const [items, setItems] = useState<DraftItem[]>([freshItem()]);

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

  async function handleItemFileChange(id: string, file: File | null) {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      updateItem(id, { fileName: "", fileSize: 0, fileError: `File is too large (max ${formatFileSize(MAX_UPLOAD_BYTES)}).` });
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateItem(id, { url: dataUrl, fileName: file.name, fileSize: file.size, fileError: "" });
    } catch {
      updateItem(id, { fileError: "Couldn't read that file. Try a different one." });
    }
  }

  function updateItem(id: string, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function addItemRow() {
    setItems((prev) => [...prev, freshItem()]);
  }

  function removeItemRow(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
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

    const cleanItems: ListItem[] = items
      .map((it): ListItem => {
        const cleanName = it.name.trim();
        const cleanDesc = it.description.trim();
        if (it.source === "file" && it.url) {
          return {
            id: it.id,
            name: cleanName,
            url: it.url,
            isFile: true,
            fileName: it.fileName,
            description: cleanDesc || undefined,
          };
        }
        return {
          id: it.id,
          name: cleanName,
          url: it.url.trim() ? normalizeUrl(it.url.trim()) : "",
          description: cleanDesc || undefined,
        };
      })
      .filter((it) => it.name);
    if (!cleanItems.length) return;

    onSave({
      id: newId("app"),
      type: "list",
      name: trimmedName,
      description: trimmedDescription || undefined,
      items: cleanItems,
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
        <div className="form-row">
          <label>Items (files, docs, or anything worth listing)</label>
          <div className="item-editor">
            {items.map((item) => (
              <div className="item-block" key={item.id}>
                <div className="item-block-row">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  />
                  <button
                    type="button"
                    className="icon-btn-sm"
                    aria-label="Remove item"
                    onClick={() => removeItemRow(item.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6 6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                />

                <div className="type-toggle type-toggle-sm" role="group" aria-label="Item source">
                  <button
                    type="button"
                    className={`type-btn${item.source === "link" ? " active" : ""}`}
                    onClick={() =>
                      updateItem(item.id, { source: "link", fileName: "", fileSize: 0, url: "", fileError: "" })
                    }
                  >
                    Link
                  </button>
                  <button
                    type="button"
                    className={`type-btn${item.source === "file" ? " active" : ""}`}
                    onClick={() => updateItem(item.id, { source: "file", url: "", fileError: "" })}
                  >
                    Upload file
                  </button>
                </div>

                {item.source === "link" ? (
                  <input
                    type="text"
                    placeholder="Link (optional)"
                    value={item.url}
                    onChange={(e) => updateItem(item.id, { url: e.target.value })}
                  />
                ) : (
                  <FilePicker
                    fileName={item.fileName}
                    fileSize={item.fileSize}
                    error={item.fileError}
                    onChange={(file) => handleItemFileChange(item.id, file)}
                    onClear={() => updateItem(item.id, { fileName: "", fileSize: 0, url: "", fileError: "" })}
                  />
                )}
              </div>
            ))}
          </div>
          <button type="button" className="add-item-btn" onClick={addItemRow}>
            + Add item
          </button>
        </div>
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
