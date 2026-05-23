// components/DateInput.jsx
// dd/mm/yyyy format wala custom date input
// Value internally yyyy-mm-dd store hoti hai (API compatible)
// Display dd/mm/yyyy hota hai

import { useState, useEffect } from "react";

// yyyy-mm-dd → dd/mm/yyyy
const toDisplay = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

// dd/mm/yyyy → yyyy-mm-dd
const toISO = (display) => {
  if (!display) return "";
  const parts = display.replace(/\D/g, ""); // sirf digits
  if (parts.length < 8) return "";
  const d = parts.slice(0, 2);
  const m = parts.slice(2, 4);
  const y = parts.slice(4, 8);
  // Basic validation
  if (Number(d) < 1 || Number(d) > 31) return "";
  if (Number(m) < 1 || Number(m) > 12) return "";
  return `${y}-${m}-${d}`;
};

export default function DateInput({ value, onChange, className, placeholder = "dd/mm/yyyy" }) {
  const [display, setDisplay] = useState(toDisplay(value));

  // External value change pe sync karo (e.g. edit form load)
  useEffect(() => {
    setDisplay(toDisplay(value));
  }, [value]);

  const handleChange = (e) => {
    let raw = e.target.value.replace(/[^\d/]/g, ""); // sirf digits aur /

    // Auto-insert slashes
    const digits = raw.replace(/\//g, "");
    let formatted = "";
    for (let i = 0; i < digits.length && i < 8; i++) {
      if (i === 2 || i === 4) formatted += "/";
      formatted += digits[i];
    }

    setDisplay(formatted);

    // Jab poora date fill ho jaye tab parent ko ISO format mein dedo
    if (digits.length === 8) {
      const iso = toISO(formatted);
      if (iso) onChange(iso);
    } else {
      // Incomplete date — parent ko empty dedo taaki validation fail ho
      onChange("");
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={10}
      className={className}
    />
  );
}