import React, { createContext, useContext, useState, useRef, useEffect } from "react";

const SelectContext = createContext(null);

/**
 * A small compound select component:
 * - <Select value onValueChange> provides context
 * - <SelectTrigger> shows current value / toggles dropdown
 * - <SelectContent> contains <SelectItem> children
 * - <SelectItem value> picks value
 * - <SelectValue> shows label (uses value prop)
 */

export function Select({ value, onValueChange = () => {}, children, placeholder = "", className = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, placeholder }}>
      <div className={`relative inline-block w-full ${className}`}>{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className = "" }) {
  const ctx = useContext(SelectContext);
  if (!ctx) return null;
  const { value, setOpen, placeholder } = ctx;
  return (
    <button onClick={() => ctx.setOpen(!ctx.open)} className={`w-full text-left px-3 py-2 border rounded-md ${className}`}>
      {children ? children : (value ? String(value) : placeholder)}
    </button>
  );
}

export function SelectValue({ placeholder = "Select..." }) {
  const ctx = useContext(SelectContext);
  if (!ctx) return null;
  const { value } = ctx;
  return <span>{value ? value : placeholder}</span>;
}

export function SelectContent({ children, className = "" }) {
  const ctx = useContext(SelectContext);
  if (!ctx) return null;
  return ctx.open ? (
    <div className={`absolute left-0 right-0 mt-1 z-50 bg-white border rounded-md shadow-sm ${className}`}>
      {children}
    </div>
  ) : null;
}

export function SelectItem({ children, value, className = "" }) {
  const ctx = useContext(SelectContext);
  if (!ctx) return null;
  return (
    <div
      role="option"
      tabIndex={0}
      onClick={() => { ctx.onValueChange(value); ctx.setOpen(false); }}
      onKeyDown={(e) => { if (e.key === "Enter") { ctx.onValueChange(value); ctx.setOpen(false); } }}
      className={`px-3 py-2 hover:bg-slate-50 cursor-pointer ${className}`}
    >
      {children}
    </div>
  );
}
