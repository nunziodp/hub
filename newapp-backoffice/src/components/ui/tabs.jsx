import * as React from "react"

import { cn } from "@/lib/utils"

// Tabs composable controllato, senza dipendenze Radix.
// Uso: <Tabs value={v} onValueChange={setV}><TabsList>…</TabsList><TabsContent value="x">…</TabsContent></Tabs>
const TabsContext = React.createContext(null)

function Tabs({ value, onValueChange, children, className }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ children, className }) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex flex-wrap items-center gap-1 border-b border-border",
        className
      )}
    >
      {children}
    </div>
  )
}

function TabsTrigger({ value, children, className }) {
  const ctx = React.useContext(TabsContext)
  const active = ctx.value === value
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-brand-600 text-brand-600"
          : "border-transparent text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, children, className }) {
  const ctx = React.useContext(TabsContext)
  if (ctx.value !== value) return null
  return <div className={cn("pt-4", className)}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
