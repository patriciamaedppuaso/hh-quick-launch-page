import type { AnnouncementRecord } from "../types";
import { Icon } from "../icons";

interface Props {
  announcement: AnnouncementRecord;
  unread: boolean;
  onOpen: () => void;
}

export function AnnouncementBanner({ announcement, unread, onOpen }: Props) {
  return (
    <button type="button" className="announcement-banner" onClick={onOpen}>
      <span className="announcement-banner-icon">
        <Icon name="megaphone" />
      </span>
      <span className="announcement-banner-text">
        <span className="announcement-banner-label">
          {unread && <span className="unread-dot" aria-label="Unread" />}
          New announcement
        </span>
        <span className="announcement-banner-title">{announcement.title}</span>
      </span>
      <span className="announcement-banner-cta">
        <span>View</span>
        <Icon name="arrow-left" className="sidebar-flip" />
      </span>
    </button>
  );
}
