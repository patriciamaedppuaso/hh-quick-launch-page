import type { Role, Theme } from "../types";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

interface Props {
  role: Role;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function Header({ role, theme, onThemeChange }: Props) {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-logo">
          H&amp;H
          <span className="brand-dot" />
        </div>
        <div>
          <div className="brand-name">Quick Launch</div>
          <div className="brand-sub">H&amp;H Medical Supply</div>
        </div>
      </div>

      <div className="topbar-actions">
        <ThemeToggle theme={theme} onChange={onThemeChange} />
        <UserMenu role={role} />
      </div>
    </div>
  );
}
