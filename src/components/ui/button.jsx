import React from "react";

export function Button({ children, className = "", variant = "default", size = "md", onClick, ...rest }) {
  const base = "inline-flex items-center justify-center rounded-md focus:outline-none";
  const sizeMap = {
    sm: "text-sm px-2 py-1",
    md: "text-sm px-3 py-2",
    lg: "text-base px-4 py-2",
  };
  const variantMap = {
    default: "bg-slate-900 text-white hover:bg-slate-800",
    outline: "bg-white border border-slate-200 text-slate-900 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-50",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };
  const cls = `${base} ${sizeMap[size] || sizeMap.md} ${variantMap[variant] || variantMap.default} ${className}`;
  return (
    <button onClick={onClick} className={cls} {...rest}>
      {children}
    </button>
  );
}
export default Button;
