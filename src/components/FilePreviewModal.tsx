import { openTarget } from "../utils";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  fileName?: string;
  url: string;
}

export function FilePreviewModal({ open, onClose, fileName, url }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={fileName || "Preview"} wide>
      <div className="pdf-preview">
        <iframe src={url} title={fileName || "PDF preview"} className="pdf-preview-frame" />
        <div className="pdf-preview-actions">
          <button type="button" className="btn-secondary" onClick={() => openTarget(url, true, fileName)}>
            Download
          </button>
        </div>
      </div>
    </Modal>
  );
}
