import { useEffect, useState } from "react";
import type { AppTile, ListItem } from "../types";
import { brandLogoSources, initialOf, newId, normalizeUrl } from "../utils";

interface Props {
  onSave: (app: AppTile) => void;
  onCancel: () => void;
}

function freshItem(): ListItem {
  return { id: newId("item"), name: "", url: "" };
}

export function AddAppForm({ onSave, onCancel }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"link" | "list">("link");
  const [url, setUrl] = useState("");
  const [items, setItems] = useState<ListItem[]>([freshItem()]);
  const [logoStep, setLogoStep] = useState(0);

  useEffect(() => {
    setLogoStep(0);
  }, [url]);

  const logoSources = url.trim() ? brandLogoSources(url) : [];

  function updateItem(id: string, field: "name" | "url", value: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
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

    if (type === "link") {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) return;
      onSave({
        id: newId("app"),
        type: "link",
        name: trimmedName,
        url: normalizeUrl(trimmedUrl),
        initial: initialOf(trimmedName),
        useBrandLogo: true,
      });
      return;
    }

    const cleanItems = items
      .map((it) => ({
        id: it.id,
        name: it.name.trim(),
        url: it.url.trim() ? normalizeUrl(it.url.trim()) : "",
      }))
      .filter((it) => it.name);
    if (!cleanItems.length) return;

    onSave({
      id: newId("app"),
      type: "list",
      name: trimmedName,
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
          <label htmlFor="fUrl">Link</label>
          <div className="url-field">
            <input
              id="fUrl"
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
        </div>
      ) : (
        <div className="form-row">
          <label>Items (files, docs, or anything worth listing)</label>
          <div className="item-editor">
            {items.map((item) => (
              <div className="item-row" key={item.id}>
                <input
                  type="text"
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Link (optional)"
                  value={item.url}
                  onChange={(e) => updateItem(item.id, "url", e.target.value)}
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
