"use client"

import { Landmark, Building2, ChevronRight } from "lucide-react"
import { useAccount } from "@/context/account"

/**
 * Distribution-hierarchy breadcrumb: Cross River Bank (client / bank) and the
 * Fintech partner (CRB's client). The Fintech partner owns every step of the
 * end-user flows by default; when a flow enters the "Compliance review" step,
 * responsibility is handed to Cross River Bank and its crumb lights up.
 */
export function ResponsibilityBreadcrumb() {
  const { complianceActive } = useAccount()

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-primary/25 bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
      <nav aria-label="Responsibility hierarchy" className="min-w-0">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
          <BreadcrumbStep
            icon={Landmark}
            label="Cross River Bank"
            sub="Client / bank"
            active={complianceActive}
          />
          <BreadcrumbSep />
          <BreadcrumbStep
            icon={Building2}
            label="Fintech partner"
            sub="CRB's client"
            active={!complianceActive}
          />
        </ol>
      </nav>
      <p className="max-w-md text-pretty text-xs leading-relaxed text-muted-foreground">
        The <span className="font-medium text-foreground">Fintech partner</span> owns every step of
        the flows below.{" "}
        {complianceActive ? (
          <span className="font-medium text-primary">
            Compliance review is live — Cross River Bank is now responsible for the decision.
          </span>
        ) : (
          <>
            When the <span className="font-medium text-foreground">Compliance review</span> step
            kicks in, responsibility hands off to Cross River Bank.
          </>
        )}
      </p>
    </div>
  )
}

function BreadcrumbStep({
  icon: Icon,
  label,
  sub,
  active = false,
}: {
  icon: typeof Landmark
  label: string
  sub: string
  active?: boolean
}) {
  return (
    <li
      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ring-1 transition-colors ${
        active ? "bg-primary/10 ring-primary/30" : "bg-muted/60 ring-foreground/5"
      }`}
    >
      <Icon className={`size-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
      <span className="flex flex-col leading-tight">
        <span className={`text-sm font-medium ${active ? "text-primary" : "text-foreground"}`}>
          {label}
        </span>
        <span className="text-[11px] text-muted-foreground">{sub}</span>
      </span>
    </li>
  )
}

function BreadcrumbSep() {
  return (
    <li aria-hidden="true">
      <ChevronRight className="size-4 text-muted-foreground/60" />
    </li>
  )
}
