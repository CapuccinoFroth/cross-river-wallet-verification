import { Wordmark } from "@/components/brand"
import { Badge } from "@/components/ui/badge"
import { WalletControl } from "@/components/wallet-control"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-4">
          <Wordmark />
          <div className="hidden h-8 w-px bg-border sm:block" />
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-semibold text-foreground">CrossRiverUSD</span>
            <span className="text-xs text-muted-foreground">
              WalletConnect compliance-enabled money movement
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden gap-1.5 border-primary/30 text-primary sm:flex">
            <span className="size-1.5 rounded-full bg-primary" />
            Interactive Demo
          </Badge>
          <WalletControl />
        </div>
      </div>
    </header>
  )
}
