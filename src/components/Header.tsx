import { useEffect, useState } from "react";

function formatTime(date: Date): string {
  const hours = date.getHours();
  const mins = String(date.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${mins} ${period}`;
}

function greetingFor(hours: number): string {
  if (hours < 12) return "Good morning.";
  if (hours < 17) return "Good afternoon.";
  return "Good evening.";
}

export function Header() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <header>
      <div>
        <p className="eyebrow">Start of work</p>
        <h1>{greetingFor(now.getHours())}</h1>
      </div>
      <div className="clock">
        <div className="time">{formatTime(now)}</div>
        <div className="date">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>
    </header>
  );
}
