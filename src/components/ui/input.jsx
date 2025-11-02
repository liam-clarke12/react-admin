import React from "react";

export function Input(props) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full px-3 py-2 border border-slate-200 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-300 ${className}`}
    />
  );
}
export default Input;