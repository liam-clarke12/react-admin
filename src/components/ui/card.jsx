import React from "react";

export function Card({ children, className = "", ...rest }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...rest }) {
  return (
    <div className={`px-4 py-3 border-b border-slate-100 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "", ...rest }) {
  return (
    <div className={`p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...rest }) {
  return (
    <div className={`text-lg font-semibold text-slate-900 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardDescription({ children, className = "", ...rest }) {
  return (
    <div className={`text-sm text-slate-500 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export default Card;
