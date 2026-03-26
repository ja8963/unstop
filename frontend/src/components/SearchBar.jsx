import { useState, useEffect, useRef } from "react";

export default function SearchBar({ medicines, onSelect, selected }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = medicines.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (med) => {
    setQuery(med.name);
    setOpen(false);
    onSelect(med.name);
  };

  const handleClear = () => {
    setQuery("");
    onSelect(null);
    setOpen(false);
  };

  const scheduleClass = (s) =>
    s === "OTC" ? "ds-otc" : s === "H" ? "ds-h" : s === "H1" ? "ds-h1" : "ds-x";

  return (
    <div ref={ref} className="search-wrapper">
      <span className="search-icon">🔍</span>
      <input
        id="medicine-search"
        className="search-input"
        placeholder="Search medicine..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && query && filtered.length > 0 && (
        <div className="search-dropdown">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="dropdown-item"
              onMouseDown={() => handleSelect(m)}
            >
              <span className="dropdown-item-name">{m.name}</span>
              <span className={`dropdown-schedule-tag ${scheduleClass(m.schedule)}`}>
                {m.schedule}
              </span>
            </div>
          ))}
        </div>
      )}
      {selected && (
        <div className="selected-medicine-display">
          <span>💊</span>
          <span className="selected-name">{selected}</span>
          <button className="clear-btn" onClick={handleClear} title="Clear">✕</button>
        </div>
      )}
    </div>
  );
}
