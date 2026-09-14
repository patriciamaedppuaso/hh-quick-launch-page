import { useRef, useState } from "react";
import type { Role } from "../types";
import { useClickOutside } from "../hooks/useClickOutside";
import { CURRENT_USER_NAME } from "../utils";

interface Props {
  role: Role;
}

export function UserMenu({ role }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const roleLabel = role === "admin" ? "Administrator" : "Staff";

  return (
    <div className="menu-wrap" ref={ref}>
      <button type="button" className="user-pill" onClick={() => setOpen((v) => !v)}>
        <span className="role-pill-avatar">MM</span>
        {CURRENT_USER_NAME}
      </button>
      {open && (
        <div className="dropdown dropdown-wide">
          <div className="dropdown-header">
            <div className="dropdown-name">{CURRENT_USER_NAME}</div>
            <div className="dropdown-role">
              {roleLabel} · H&amp;H Medical Supply
            </div>
          </div>
          <div className="dropdown-divider" />
          <button type="button" className="dropdown-item" onClick={() => setOpen(false)}>
            Profile settings
          </button>
          <button type="button" className="dropdown-item" onClick={() => setOpen(false)}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
