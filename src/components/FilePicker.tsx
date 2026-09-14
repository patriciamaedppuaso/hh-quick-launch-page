import { formatFileSize } from "../utils";

interface Props {
  fileName: string;
  fileSize: number;
  error?: string;
  onChange: (file: File | null) => void;
  onClear: () => void;
}

export function FilePicker({ fileName, fileSize, error, onChange, onClear }: Props) {
  const inputId = `file-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="file-picker">
      {fileName ? (
        <div className="file-picker-selected">
          <span className="file-picker-name">{fileName}</span>
          <span className="file-picker-size">{formatFileSize(fileSize)}</span>
          <button type="button" className="icon-btn-sm" aria-label="Remove file" onClick={onClear}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <label htmlFor={inputId} className="file-picker-btn">
          Choose file
          <input
            id={inputId}
            type="file"
            className="file-picker-input"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
