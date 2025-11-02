import React from "react";

export function Badge({ children, variant = "default", className = "" }) {
  const base = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  const map = {
    default: "bg-slate-100 text-slate-800",
    secondary: "bg-slate-50 text-slate-800 border border-slate-200",
    outline: "bg-transparent text-slate-700 border border-slate-200",
  };
  return <span className={`${base} ${map[variant] || map.default} ${className}`}>{children}</span>;
}
export default Badge;
