import { useRef, useState } from "react";
import { useClickOutside } from "../hooks/useClickOutside";

interface Props {
  itemLabel: string;
  onSelectItem: () => void;
  onSelectFolder: () => void;
}

export function AddMenuButton({ itemLabel, onSelectItem, onSelectFolder }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="add-menu" ref={ref}>
      <button type="button" className="btn-primary items-add-btn" onClick={() => setOpen((v) => !v)}>
        + Add
      </button>
      {open && (
        <div className="dropdown add-menu-dropdown">
          <button
            type="button"
            className="dropdown-item"
            onClick={() => {
              setOpen(false);
              onSelectItem();
            }}
          >
            Add {itemLabel}
          </button>
          <button
            type="button"
            className="dropdown-item"
            onClick={() => {
              setOpen(false);
              onSelectFolder();
            }}
          >
            Add Folder
          </button>
        </div>
      )}
    </div>
  );
}
