"use client"

import { Settings2, RefreshCw, PanelLeftClose } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDemoControls } from "@/context/demo-controls"
import { useAccount } from "@/context/account"
import { cn } from "@/lib/utils"

export function DemoControlsPanel({ onClose }: { onClose?: () => void }) {
  const controls = useDemoControls()
  const { reset: resetAccount } = useAccount()

  const reject = controls.crossriverDecision === "reject"

  type Toggle = {
    id: keyof typeof controls
    label: string
    hint: string
    value: boolean
    onChange: (v: boolean) => void
  }

  const generalToggles: Toggle[] = [
    {
      id: "screeningDelay",
      label: "Enhanced review delay",
      hint: "Simulate slower CrossRiver screening",
      value: controls.screeningDelay,
      onChange: (v) => controls.setControl("screeningDelay", v),
    },
  ]

  const payinToggles: Toggle[] = [
    {
      id: "payinVerification",
      label: "Wallet ownership verification",
      hint: "Require a SIWX signature on pay-in",
      value: controls.payinVerification,
      onChange: (v) => controls.setControl("payinVerification", v),
    },
    {
      id: "travelRulePayin",
      label: "Travel Rule required",
      hint: "Collect name, DOB & nationality",
      value: controls.travelRulePayin,
      onChange: (v) => controls.setControl("travelRulePayin", v),
    },
  ]

  const payoutToggles: Toggle[] = [
    {
      id: "payoutVerification",
      label: "Wallet ownership verification",
      hint: "Require a SIWX signature on payout",
      value: controls.payoutVerification,
      onChange: (v) => controls.setControl("payoutVerification", v),
    },
    {
      id: "travelRulePayout",
      label: "Travel Rule required",
      hint: "Collect name, DOB & nationality",
      value: controls.travelRulePayout,
      onChange: (v) => controls.setControl("travelRulePayout", v),
    },
    {
      id: "beneficiaryMismatch",
      label: "Beneficiary mismatch",
      hint: "Hold payouts for manual review",
      value: controls.beneficiaryMismatch,
      onChange: (v) => controls.setControl("beneficiaryMismatch", v),
    },
  ]

  const renderToggles = (toggles: Toggle[]) => (
    <div className="flex flex-col divide-y divide-border">
      {toggles.map((t) => (
        <div key={t.id} className="flex items-center justify-between gap-4 py-3">
          <div className="flex flex-col">
            <Label htmlFor={`toggle-${t.id}`} className="text-sm font-medium text-foreground">
              {t.label}
            </Label>
            <span className="text-xs text-muted-foreground">{t.hint}</span>
          </div>
          <Switch id={`toggle-${t.id}`} checked={t.value} onCheckedChange={t.onChange} />
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 ring-1 ring-foreground/5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Settings2 className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Demo controls</h3>
            <p className="text-xs text-muted-foreground">Simulate CrossRiver&apos;s compliance outcomes</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">
            Prototype
          </Badge>
          {onClose ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              onClick={onClose}
              aria-label="Hide demo controls"
            >
              <PanelLeftClose className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {/* CrossRiver decision segmented control */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs tracking-wide text-muted-foreground uppercase">
          CrossRiver policy decision
        </Label>
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => controls.setControl("crossriverDecision", "approve")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              !reject ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => controls.setControl("crossriverDecision", "reject")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              reject ? "bg-destructive text-background shadow-sm" : "text-muted-foreground",
            )}
          >
            Decline
          </button>
        </div>
      </div>

      {renderToggles(generalToggles)}

      <div className="flex flex-col gap-1">
        <Label className="text-xs tracking-wide text-muted-foreground uppercase">Pay-in</Label>
        {renderToggles(payinToggles)}
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs tracking-wide text-muted-foreground uppercase">Payout</Label>
        {renderToggles(payoutToggles)}
      </div>

      <Button
        variant="outline"
        className="h-9"
        onClick={() => {
          controls.resetDemo()
          resetAccount()
        }}
      >
        <RefreshCw className="size-4" /> Reset demo state
      </Button>
    </div>
  )
}
