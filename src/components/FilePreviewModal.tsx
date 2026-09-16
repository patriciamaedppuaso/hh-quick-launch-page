import { openTarget } from "../utils";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  fileName?: string;
  url: string;
  isImage?: boolean;
}

export function FilePreviewModal({ open, onClose, fileName, url, isImage }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={fileName || "Preview"} wide>
      <div className="pdf-preview">
        {isImage ? (
          <img src={url} alt={fileName || ""} className="image-preview-frame" />
        ) : (
          <iframe src={url} title={fileName || "Preview"} className="pdf-preview-frame" />
        )}
        <div className="pdf-preview-actions">
          <button type="button" className="btn-secondary" onClick={() => openTarget(url, true, fileName)}>
            Download
          </button>
        </div>
      </div>
    </Modal>
  );
}
