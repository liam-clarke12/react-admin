import React from "react";

export function ScrollArea({ children, className = "", style = {}, ...rest }) {
  return (
    <div
      className={`w-full overflow-auto ${className}`}
      style={{ WebkitOverflowScrolling: "touch", ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
export default ScrollArea;
