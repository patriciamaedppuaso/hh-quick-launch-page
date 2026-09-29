import type { ReactNode } from "react";
import { Modal } from "./Modal";

export interface DetailField {
  label: string;
  value: ReactNode;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: DetailField[];
  onEdit?: () => void;
}

export function DetailModal({ open, onClose, title, fields, onEdit }: Props) {
  const visible = fields.filter((f) => f.value !== undefined && f.value !== null && f.value !== "");

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="detail-view">
        {visible.length === 0 ? (
          <p className="form-hint">Nothing to show yet.</p>
        ) : (
          visible.map((f) => (
            <div className="detail-row" key={f.label}>
              <span className="detail-label">{f.label}</span>
              <span className="detail-value">{f.value}</span>
            </div>
          ))
        )}
      </div>
      <div className="form-buttons">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Close
        </button>
        {onEdit && (
          <button type="button" className="btn-primary" onClick={onEdit}>
            Edit
          </button>
        )}
      </div>
    </Modal>
  );
}
