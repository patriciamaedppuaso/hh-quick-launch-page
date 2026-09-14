import type { ViewMode } from "../types";
import { Icon } from "../icons";

interface Props {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onChange }: Props) {
  return (
    <div className="view-toggle" role="group" aria-label="View">
      <button
        type="button"
        className={`view-toggle-btn${view === "list" ? " active" : ""}`}
        onClick={() => onChange("list")}
        aria-label="List view"
        title="List view"
      >
        <Icon name="list" />
      </button>
      <button
        type="button"
        className={`view-toggle-btn${view === "grid" ? " active" : ""}`}
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        title="Grid view"
      >
        <Icon name="grid" />
      </button>
    </div>
  );
}
