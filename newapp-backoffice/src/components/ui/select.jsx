import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

// Select basato su <select> nativo (nessuna dipendenza Radix), stilizzato come shadcn.
// Props: value, onValueChange(fn), options ([{value, label}] | string[]),
//        placeholder (mostrato come prima opzione con value=""), className.
// I children <option> sono comunque supportati se passati direttamente.
const Select = React.forwardRef(
  ({ className, value, onValueChange, options, placeholder, children, ...props }, ref) => {
    const normalized = (options ?? []).map((o) =>
      typeof o === "string" ? { value: o, label: o } : o
    )

    return (
      <div className="relative">
        <select
          ref={ref}
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          className={cn(
            "flex h-9 w-full appearance-none rounded-md border border-input bg-background px-3 py-1 pr-8 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        >
          {placeholder != null && <option value="">{placeholder}</option>}
          {normalized.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
