import React from "react";

export function Dialog({ open = false, children, onOpenChange = () => {} }) {
  if (!open) return null;
  // very simple modal
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center p-6">
      <div className="fixed inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-3xl">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function DialogHeader({ children, className = "" }) {
  return <div className={`px-6 py-4 border-b ${className}`}>{children}</div>;
}
export function DialogTitle({ children, className = "" }) {
  return <h3 className={`text-lg font-bold ${className}`}>{children}</h3>;
}
export function DialogDescription({ children, className = "" }) {
  return <div className={`text-sm text-slate-600 ${className}`}>{children}</div>;
}
export function DialogFooter({ children, className = "" }) {
  return <div className={`px-6 py-4 border-t flex justify-end gap-2 ${className}`}>{children}</div>;
}
