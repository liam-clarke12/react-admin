import React, { createContext, useContext } from "react";

const TabsContext = createContext({ value: null, onChange: () => {} });

export function Tabs({ children, value, onValueChange = () => {}, className = "" }) {
  return (
    <TabsContext.Provider value={{ value, onChange: onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = "" }) {
  return <div className={`flex gap-2 ${className}`}>{children}</div>;
}

export function TabsTrigger({ children, value, className = "" }) {
  const ctx = useContext(TabsContext);
  const active = ctx.value === value;
  return (
    <button
      onClick={() => ctx.onChange(value)}
      className={`px-3 py-1.5 rounded-md ${active ? "bg-violet-600 text-white" : "bg-transparent text-slate-700"} ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value, className = "" }) {
  const ctx = useContext(TabsContext);
  if (ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}
