import { cn } from "@/lib/utils"

// Text-based wordmark placeholder. This is a concept demo and intentionally
// does not reproduce the official CrossRiver logo.
export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)} aria-label="CrossRiverUSD">
      <span
        aria-hidden
        className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
      >
        C
      </span>
      <span className="text-lg font-bold tracking-tight text-foreground">
        CrossRiver
        <span className="text-primary">USD</span>
      </span>
    </div>
  )
}
