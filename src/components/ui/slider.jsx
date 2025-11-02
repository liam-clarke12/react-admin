import React from "react";

export function Slider({ value = 1, min = 0, max = 1, step = 0.1, onValueChange = () => {}, ...rest }) {
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onValueChange(Number(e.target.value))}
      {...rest}
      className="w-full h-2 appearance-none bg-slate-200 rounded-lg"
      aria-valuemin={min}
      aria-valuemax={max}
    />
  );
}
export default Slider;
