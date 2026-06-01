import { cn } from "@/lib/utils"

// Skeleton shadcn/ui — placeholder animato per gli stati di caricamento
function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
