import * as React from "react"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

// Checkbox controllato senza dipendenze Radix: input nativo nascosto + box stilizzato.
// Supporta lo stato "indeterminate" (selezione parziale nelle tabelle).
// Props: checked (bool), indeterminate (bool), onCheckedChange(fn), disabled
const Checkbox = React.forwardRef(
  ({ className, checked = false, indeterminate = false, onCheckedChange, disabled, ...props }, ref) => {
    const innerRef = React.useRef(null)
    React.useImperativeHandle(ref, () => innerRef.current)

    // L'attributo indeterminate esiste solo via DOM, non come prop React
    React.useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = indeterminate
    }, [indeterminate])

    const attivo = checked || indeterminate

    return (
      <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          ref={innerRef}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          {...props}
        />
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded border border-input shadow-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:opacity-50",
            attivo ? "border-brand-600 bg-brand-600 text-white" : "bg-background",
            className
          )}
        >
          {indeterminate ? (
            <Minus className="h-3 w-3" strokeWidth={3} />
          ) : checked ? (
            <Check className="h-3 w-3" strokeWidth={3} />
          ) : null}
        </span>
      </span>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
