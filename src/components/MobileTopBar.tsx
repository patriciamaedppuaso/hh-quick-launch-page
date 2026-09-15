import { Icon } from "../icons";

interface Props {
  onOpenMenu: () => void;
}

export function MobileTopBar({ onOpenMenu }: Props) {
  return (
    <div className="mobile-topbar">
      <button type="button" className="mobile-menu-btn" onClick={onOpenMenu} aria-label="Open menu">
        <Icon name="menu" />
      </button>
      <div className="mobile-topbar-brand">
        <div className="brand-logo brand-logo-sm">H&amp;H</div>
        <span className="mobile-topbar-title">Quick Launch</span>
      </div>
    </div>
  );
}
