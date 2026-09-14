import { useEffect, useState } from "react";
import { Icon } from "../icons";

function formatTime(date: Date): string {
  const hours = date.getHours();
  const mins = String(date.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${mins} ${period}`;
}

function greetingFor(hours: number): string {
  if (hours < 12) return "Good morning";
  if (hours < 17) return "Good afternoon";
  return "Good evening";
}

export function Greeting() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hero">
      <div className="hero-text">
        <p className="eyebrow">Start of work</p>
        <h1>
          {greetingFor(now.getHours())}
          <span className="wave">👋</span>
        </h1>
        <p className="hero-sub">Everything you need for today's work, organized in one place.</p>
      </div>
      <div className="clock">
        <div className="time">{formatTime(now)}</div>
        <div className="date">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <div className="location">
          <Icon name="pin" className="location-icon" />
          Whittier, California
        </div>
      </div>
    </div>
  );
}
