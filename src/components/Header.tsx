import { useEffect, useState } from "react";
import type { Role, Theme } from "../types";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

interface Props {
  role: Role;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  divided?: boolean;
}

export function Header({ role, theme, onThemeChange, divided }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 4);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const showDivider = divided || scrolled;

  return (
    <div className={`topbar${showDivider ? " topbar--divided" : ""}`}>
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
