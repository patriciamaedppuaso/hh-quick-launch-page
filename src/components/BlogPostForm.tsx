import { useState } from "react";
import type { BlogPostRecord } from "../types";
import { newId, slugify, todayIso } from "../utils";
import { AvatarPicker } from "./AvatarPicker";
import { PersonSearchInput } from "./PersonSearchInput";

interface Props {
  initial?: BlogPostRecord;
  existingSlugs: string[];
  authorOptions: string[];
  onSave: (record: BlogPostRecord) => void;
  onCancel: () => void;
}

export function BlogPostForm({ initial, existingSlugs, authorOptions, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl ?? "");
  const [authorName, setAuthorName] = useState(initial?.authorName ?? "H&H Medical Supply Team");
  const [publishedAt, setPublishedAt] = useState(
    initial?.publishedAt ? initial.publishedAt.slice(0, 10) : todayIso(),
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState("");

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(value);
  }

  function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }
    const trimmedSlug = slugify(slug);
    if (!trimmedSlug) {
      setError("Slug is required.");
      return;
    }
    const takenByOther = existingSlugs.some((s) => s === trimmedSlug && s !== initial?.slug);
    if (takenByOther) {
      setError(`"${trimmedSlug}" is already used by another post.`);
      return;
    }
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError("Content is required.");
      return;
    }
    setError("");
    onSave({
      id: initial?.id ?? newId("post"),
      slug: trimmedSlug,
      title: trimmedTitle,
      excerpt: excerpt.trim() || undefined,
      content: trimmedContent,
      coverImageUrl: coverImageUrl || undefined,
      authorName: authorName.trim() || undefined,
      isActive,
      publishedAt: publishedAt || undefined,
      createdAt: initial?.createdAt ?? todayIso(),
    });
  }

  return (
    <div className="form-card">
      <div className="form-row">
        <label htmlFor="bpTitle">Title</label>
        <input
          id="bpTitle"
          type="text"
          placeholder="e.g. Hospital Bed, Wheelchair, or Both?"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="bpSlug">Slug</label>
        <input
          id="bpSlug"
          type="text"
          placeholder="e.g. hospital-bed-wheelchair-or-both"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
        />
        <p className="form-hint">Used in the post's URL — must be unique. Auto-filled from the title until you edit it directly.</p>
      </div>
      <div className="form-row">
        <label htmlFor="bpExcerpt">Excerpt (optional)</label>
        <textarea
          id="bpExcerpt"
          rows={2}
          placeholder="Short summary shown in blog listings..."
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="bpContent">Content</label>
        <textarea
          id="bpContent"
          rows={10}
          placeholder="Write the post here — Markdown is supported (# Heading, **bold**, - lists, etc.)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div className="form-row">
        <label>Cover image (optional)</label>
        <AvatarPicker name={title} avatar={coverImageUrl} onChange={setCoverImageUrl} onClear={() => setCoverImageUrl("")} />
      </div>
      <div className="form-row">
        <label htmlFor="bpAuthor">Author name</label>
        <PersonSearchInput id="bpAuthor" value={authorName} onChange={setAuthorName} options={authorOptions} />
      </div>
      <div className="form-row">
        <label htmlFor="bpDate">Published date</label>
        <input id="bpDate" type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
      </div>
      <div className="form-row form-row-checkbox">
        <label className="checkbox-label">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Published (visible on the public site)
        </label>
      </div>
      {error && <p className="field-error">{error}</p>}

      <div className="form-buttons">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleSave}>
          {initial ? "Save" : "Create Post"}
        </button>
      </div>
    </div>
  );
}
