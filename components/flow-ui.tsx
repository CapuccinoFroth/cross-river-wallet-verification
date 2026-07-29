"use client"

import type { ReactNode } from "react"
import { ChevronDown, Check, FileText } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { TravelRuleData } from "@/lib/demo"

export function StepCard({
  step,
  title,
  description,
  active = true,
  children,
  className,
}: {
  step: ReactNode
  title: string
  description?: ReactNode
  active?: boolean
  children?: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-5 ring-1 ring-foreground/5 transition-opacity",
        !active && "opacity-70",
        className,
      )}
      aria-current={active ? "step" : undefined}
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {step}
        </span>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  )
}

export function InfoRow({
  label,
  value,
  mono,
  strong,
}: {
  label: string
  value: ReactNode
  mono?: boolean
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-right",
          mono && "font-mono",
          strong ? "font-semibold text-foreground" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  )
}

export function DataRelayed({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <Collapsible className="rounded-xl border border-border bg-muted/40">
      <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground">
        Data relayed to Cross River
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 border-t border-border px-4 py-3 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-col py-1">
              <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
                {r.label}
              </dt>
              <dd className="font-mono text-xs break-all text-foreground">{r.value}</dd>
            </div>
          ))}
        </dl>
        <p className="px-4 pb-3 text-[11px] text-muted-foreground">
          Masked demo values — no real personal data is exposed.
        </p>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function StepIndicator({
  current,
  labels,
  owners,
}: {
  current: number
  labels: string[]
  /** Optional per-step responsible party, rendered as a caption under the label. */
  owners?: (string | undefined)[]
}) {
  return (
    <ol className="flex items-center gap-2">
      {labels.map((label, i) => {
        const done = i < current
        const active = i === current
        const owner = owners?.[i]
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary/15 text-primary ring-2 ring-primary/40",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className="hidden flex-col leading-tight sm:flex">
                <span
                  className={cn(
                    "text-xs font-medium",
                    active || done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
                {owner ? (
                  <span
                    className={cn(
                      "text-[10px] font-medium tracking-wide",
                      active || done ? "text-primary" : "text-muted-foreground/70",
                    )}
                  >
                    {owner}
                  </span>
                ) : null}
              </span>
            </div>
            {i < labels.length - 1 ? (
              <span className={cn("h-px flex-1", done ? "bg-primary/40" : "bg-border")} />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

export function TravelRuleFields({
  value,
  onChange,
  description,
}: {
  value: TravelRuleData
  onChange: (next: TravelRuleData) => void
  description: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-accent bg-accent/40 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-accent-foreground">
        <FileText className="size-4" /> Travel Rule information required
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="tr-name" className="text-xs text-muted-foreground">
            Full name
          </Label>
          <Input
            id="tr-name"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="e.g. Alex Rivera"
            className="h-10 bg-card"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tr-dob" className="text-xs text-muted-foreground">
            Date of birth
          </Label>
          <Input
            id="tr-dob"
            type="date"
            value={value.dob}
            onChange={(e) => onChange({ ...value, dob: e.target.value })}
            className="h-10 bg-card"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tr-nationality" className="text-xs text-muted-foreground">
            Nationality
          </Label>
          <Input
            id="tr-nationality"
            value={value.nationality}
            onChange={(e) => onChange({ ...value, nationality: e.target.value })}
            placeholder="e.g. United States"
            className="h-10 bg-card"
          />
        </div>
      </div>
    </div>
  )
}

export function ResponsibilityNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border-l-2 border-primary bg-primary/5 px-3 py-2 text-xs leading-relaxed text-foreground">
      {children}
    </p>
  )
}
