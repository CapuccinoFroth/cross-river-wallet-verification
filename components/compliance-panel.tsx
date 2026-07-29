"use client"

import type { ReactNode } from "react"
import { Link2, ShieldCheck, Lock } from "lucide-react"
import { Card } from "@/components/ui/card"

const CONTENT = {
  topup: {
    walletconnect: [
      "Connects the external wallet",
      "Requests ownership signature",
      "Validates signature evidence",
      "Relays wallet and transaction data",
      "Coordinates Travel Rule data exchange",
      "Delivers status webhooks",
    ],
    crossriver: [
      "Matches the wallet to the Cross River customer",
      "Applies KYC and account permissions",
      "Screens the transaction",
      "Determines whether the deposit is allowed",
      "Credits the Cross River ledger",
    ],
    bottom: "No funds are credited until Cross River returns an approved decision.",
  },
  payout: {
    walletconnect: [
      "Connects the destination wallet",
      "Requests proof-of-control signature",
      "Verifies wallet-ownership evidence",
      "Relays beneficiary and wallet information",
      "Coordinates Travel Rule data exchange",
      "Returns verification status to Cross River",
    ],
    crossriver: [
      "Identifies the Cross River customer",
      "Validates the beneficiary",
      "Screens the destination wallet",
      "Applies payout permissions",
      "Makes the final approve or reject decision",
      "Instructs Cross River Treasury to move funds",
    ],
    bottom:
      "Cross River Treasury does not initiate the payout until the beneficiary wallet is verified and Cross River approves the withdrawal.",
  },
} as const

export function CompliancePanel({
  variant,
  children,
}: {
  variant: "topup" | "payout"
  children?: ReactNode
}) {
  const content = CONTENT[variant]

  return (
    <Card className="sticky top-24 gap-0 ring-foreground/10">
      <div className="flex items-center gap-2 border-b border-border px-4 pb-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="size-4" />
        </span>
        <div className="flex flex-col">
          <h2 className="text-base font-semibold text-foreground">Compliance on Flow</h2>
          <p className="text-xs text-muted-foreground">What happens behind the scenes</p>
        </div>
      </div>

      {/* Live status area */}
      {children ? (
        <div className="border-b border-border bg-surface-blue/40 px-4 py-4">{children}</div>
      ) : null}

      <div className="flex flex-col gap-4 px-4 py-4">
        <ResponsibilityBlock
          icon={<Link2 className="size-3.5" />}
          title="WalletConnect"
          tone="wc"
          items={content.walletconnect}
        />
        <ResponsibilityBlock
          icon={<ShieldCheck className="size-3.5" />}
          title="Cross River"
          tone="crossriver"
          items={content.crossriver}
        />
      </div>

      <div className="mx-4 mb-4 flex items-start gap-2 rounded-lg bg-brand-navy px-3 py-2.5 text-xs font-medium text-background">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        <span className="text-pretty">{content.bottom}</span>
      </div>
    </Card>
  )
}

function ResponsibilityBlock({
  icon,
  title,
  tone,
  items,
}: {
  icon: ReactNode
  title: string
  tone: "wc" | "crossriver"
  items: readonly string[]
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <span
          className={
            tone === "wc"
              ? "flex size-5 items-center justify-center rounded-md bg-primary/10 text-primary"
              : "flex size-5 items-center justify-center rounded-md bg-brand-navy/10 text-brand-navy"
          }
        >
          {icon}
        </span>
        <span
          className={
            tone === "wc"
              ? "text-sm font-semibold text-primary"
              : "text-sm font-semibold text-brand-navy"
          }
        >
          {title}
        </span>
      </div>
      <ul className="flex flex-col gap-1.5 pl-1">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
            <span
              className={
                tone === "wc"
                  ? "mt-1.5 size-1 shrink-0 rounded-full bg-primary"
                  : "mt-1.5 size-1 shrink-0 rounded-full bg-brand-navy"
              }
            />
            <span className="text-pretty leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
