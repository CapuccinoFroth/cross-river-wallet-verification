"use client"

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  CircleAlert,
  ShieldAlert,
  Wallet,
} from "lucide-react"
import { useAccount, type ActivityItem, type ActivityStatus } from "@/context/account"
import { formatUsd } from "@/lib/demo"
import { cn } from "@/lib/utils"

const statusMeta: Record<
  ActivityStatus,
  { label: string; className: string; icon: typeof Check }
> = {
  completed: { label: "Completed", className: "text-primary", icon: Check },
  blocked: { label: "Blocked", className: "text-destructive", icon: CircleAlert },
  review: { label: "In review", className: "text-accent-foreground", icon: ShieldAlert },
}

export function ActivityPanel() {
  const { balance, history } = useAccount()

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 ring-1 ring-foreground/5">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Wallet className="size-4" />
        </span>
        <h3 className="text-sm font-semibold text-foreground">Cross River account</h3>
      </div>

      <div className="rounded-xl border border-border bg-gradient-to-br from-brand-navy to-brand-blue p-5 text-background">
        <div className="text-xs font-medium tracking-wide text-background/70 uppercase">
          Available balance
        </div>
        <div className="mt-1 font-mono text-3xl font-semibold tracking-tight">
          {formatUsd(balance)}
        </div>
        <div className="mt-1 text-xs text-background/70">Illustrative demo balance</div>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Recent activity
        </h4>
        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            No activity yet. Complete a top-up or payout to see it here.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((item) => (
              <ActivityRow key={item.id + item.at} item={item} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const isTopup = item.kind === "topup"
  const meta = statusMeta[item.status]
  const StatusIcon = meta.icon
  const positive = isTopup && item.status === "completed"

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          isTopup ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground",
        )}
      >
        {isTopup ? (
          <ArrowDownToLine className="size-4" />
        ) : (
          <ArrowUpFromLine className="size-4" />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">{item.detail}</span>
        <span className={cn("flex items-center gap-1 text-xs", meta.className)}>
          <StatusIcon className="size-3" /> {meta.label} · {item.network}
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 font-mono text-sm font-semibold",
          positive ? "text-primary" : "text-foreground",
        )}
      >
        {positive ? "+" : isTopup ? "" : "−"}
        {formatUsd(item.amount)}
      </span>
    </li>
  )
}
