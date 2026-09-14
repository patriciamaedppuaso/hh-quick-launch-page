import { useRef, useState } from "react";
import type { IconName, Theme } from "../types";
import { Icon } from "../icons";
import { useClickOutside } from "../hooks/useClickOutside";

interface Props {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

const OPTIONS: { value: Theme; label: string; icon: IconName }[] = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "system", label: "Default", icon: "monitor" },
];

export function ThemeToggle({ theme, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2];

  return (
    <div className="menu-wrap" ref={ref}>
      <button
        type="button"
        className="icon-btn-circle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change theme"
        title={`Theme: ${current.label}`}
      >
        <Icon name={current.icon} />
      </button>
      {open && (
        <div className="dropdown dropdown-narrow">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`dropdown-item${opt.value === theme ? " active" : ""}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <Icon name={opt.icon} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
