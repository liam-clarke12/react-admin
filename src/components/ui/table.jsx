import React from "react";

export function Table({ children, className = "", ...rest }) {
  return (
    <table className={`min-w-full table-auto ${className}`} {...rest}>
      {children}
    </table>
  );
}

export function TableHeader({ children, className = "", ...rest }) {
  return (
    <thead className={className} {...rest}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "", ...rest }) {
  return (
    <tbody className={className} {...rest}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = "", ...rest }) {
  return (
    <tr className={`border-b last:border-none ${className}`} {...rest}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "", ...rest }) {
  return (
    <th className={`text-left px-3 py-2 text-xs font-medium text-slate-600 ${className}`} {...rest}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "", ...rest }) {
  return (
    <td className={`px-3 py-2 text-sm text-slate-700 ${className}`} {...rest}>
      {children}
    </td>
  );
}
