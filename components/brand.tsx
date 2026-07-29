import Image from "next/image"
import { cn } from "@/lib/utils"

// Brand wordmark using the official Cross River infinity mark.
export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)} aria-label="Cross River">
      <Image
        src="/crossriver-logo.png"
        alt="Cross River"
        width={44}
        height={26}
        priority
        className="h-6 w-auto"
      />
      <span className="text-lg font-bold tracking-tight text-foreground">Cross River</span>
    </div>
  )
}
