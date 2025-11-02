import React from "react";

export function Checkbox({ checked = false, onCheckedChange = () => {}, className = "", ...rest }) {
  return (
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={`w-4 h-4 text-indigo-600 border-slate-300 rounded ${className}`}
      {...rest}
    />
  );
}
export default Checkbox;
