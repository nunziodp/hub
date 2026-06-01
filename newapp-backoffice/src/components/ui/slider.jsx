import * as React from "react"

import { cn } from "@/lib/utils"

// Slider basato su <input type="range"> nativo, stilizzato con accent-color.
// Props: value (number), onValueChange(fn), min, max, step, disabled
const Slider = React.forwardRef(
  ({ className, value, onValueChange, min = 0, max = 100, step = 1, disabled, ...props }, ref) => (
    <input
      type="range"
      ref={ref}
      value={value}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={(e) => onValueChange?.(Number(e.target.value))}
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-brand-600 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
)
Slider.displayName = "Slider"

export { Slider }
