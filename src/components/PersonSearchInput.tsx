import { useEffect, useRef, useState } from "react";
import { useClickOutside } from "../hooks/useClickOutside";

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

export function PersonSearchInput({ id, value, onChange, options, placeholder }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapRef, () => setOpen(false));

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed ? options.filter((n) => n.toLowerCase().includes(trimmed)) : options;

  function select(name: string) {
    onChange(name);
    setQuery(name);
    setOpen(false);
  }

  return (
    <div className="person-search" ref={wrapRef}>
      <input
        id={id}
        type="text"
        placeholder={placeholder ?? "Search people..."}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="person-search-menu">
          {filtered.map((name) => (
            <button type="button" key={name} className="person-search-option" onClick={() => select(name)}>
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
