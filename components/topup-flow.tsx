"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAppKitAccount } from "@reown/appkit/react"
import {
  ArrowRight,
  ArrowLeft,
  Coins,
  Check,
  CircleAlert,
  Clock,
  Copy,
  FileText,
  Pause,
  Play,
  RefreshCw,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useWalletVerification } from "@/hooks/use-wallet-verification"
import { useDemoControls } from "@/context/demo-controls"
import { useAccount } from "@/context/account"
import { WalletVerifyCard } from "@/components/wallet-verify-card"
import { FlowTimeline, type TimelineStage } from "@/components/flow-timeline"
import {
  StepCard,
  InfoRow,
  DataRelayed,
  ResponsibilityNote,
  StepIndicator,
  TravelRuleFields,
} from "@/components/flow-ui"
import {
  FUNDING_ASSETS,
  QUICK_AMOUNTS,
  type FundingAsset,
  estimateCredit,
  formatUsd,
  formatToken,
  chainLabel,
  shortenAddress,
  shortId,
  demoTxHash,
  timestamp,
  EMPTY_TRAVEL_RULE,
  isTravelRuleComplete,
  type TravelRuleData,
} from "@/lib/demo"

type Phase = "verify" | "configure" | "review" | "processing" | "success" | "blocked"

const STEP_LABELS = ["Verify", "Fund", "Review", "Compliance review", "Settle"]
// The compliance review step is owned by Cross River Bank (CRB).
const STEP_OWNERS = [undefined, undefined, undefined, "Cross River Bank", undefined]

function phaseToStep(phase: Phase): number {
  switch (phase) {
    case "verify":
      return 0
    case "configure":
      return 1
    // The user reviews & acknowledges their own request here — still the
    // fintech-side "Review" step, before anything is handed to Cross River.
    case "review":
      return 2
    // Active screening and a compliance block live inside the Cross River
    // owned "Compliance review" step.
    case "processing":
    case "blocked":
      return 3
    // Settlement only completes after Cross River approves, so success marks every
    // step — including "Settle" — as done.
    case "success":
      return 5
    default:
      return 3
  }
}

export function TopUpFlow({ onConnectRequest }: { onConnectRequest: () => void }) {
  const { isConnected } = useAppKitAccount()
  const verification = useWalletVerification()
  const controls = useDemoControls()
  const { credit, logOnly, setComplianceActive } = useAccount()

  const [phase, setPhase] = useState<Phase>("verify")
  const [asset, setAsset] = useState<FundingAsset>(FUNDING_ASSETS[0])
  const [amount, setAmount] = useState<string>("250")
  const [travelRule, setTravelRule] = useState<TravelRuleData>(EMPTY_TRAVEL_RULE)
  const [acknowledged, setAcknowledged] = useState(false)
  const [copied, setCopied] = useState(false)
  const [paused, setPaused] = useState(false)
  // Explicit ownership attestation — a fresh SIWX signature is always
  // requested when pay-in verification is ON, even if a session already
  // exists from a previous connect or the Payout flow.
  const [ownershipAttested, setOwnershipAttested] = useState(false)
  const [attestRequesting, setAttestRequesting] = useState(false)
  const attestRequestedRef = useRef(false)
  const [receipt, setReceipt] = useState<{
    reference: string
    txHash: string
    at: string
    credit: number
    cost: number
  } | null>(null)
  const [blockReason, setBlockReason] = useState<string>("")

  const resetAttestation = useCallback(() => {
    setOwnershipAttested(false)
    setAttestRequesting(false)
    attestRequestedRef.current = false
  }, [])

  // Reset the whole flow when the demo is reset or the wallet disconnects.
  useEffect(() => {
    setPhase("verify")
    setAcknowledged(false)
    setReceipt(null)
    setTravelRule(EMPTY_TRAVEL_RULE)
    setPaused(false)
    resetAttestation()
  }, [controls.resetSignal, resetAttestation])

  useEffect(() => {
    if (!isConnected) {
      setPhase("verify")
      setAcknowledged(false)
      setReceipt(null)
      resetAttestation()
    }
  }, [isConnected, resetAttestation])

  // A fresh signature landing (verified flips true after we requested one)
  // confirms ownership for pay-in.
  useEffect(() => {
    if (attestRequestedRef.current && verification.verified) {
      setOwnershipAttested(true)
      setAttestRequesting(false)
    }
  }, [verification.verified])

  // Hand responsibility to Cross River Bank while the flow sits in the
  // "Compliance review" step (breadcrumb reflects this).
  useEffect(() => {
    setComplianceActive(phaseToStep(phase) === 3)
    return () => setComplianceActive(false)
  }, [phase, setComplianceActive])

  const handleAttest = useCallback(async () => {
    attestRequestedRef.current = true
    setOwnershipAttested(false)
    setAttestRequesting(true)
    try {
      await verification.requestFreshSignature()
    } catch {
      // Signature was declined or dismissed — allow another attempt.
      setAttestRequesting(false)
    }
  }, [verification])

  const usdAmount = useMemo(() => {
    const n = Number.parseFloat(amount)
    return Number.isFinite(n) && n > 0 ? n : 0
  }, [amount])

  const tokenAmount = useMemo(() => (asset.rate ? usdAmount / asset.rate : 0), [usdAmount, asset])
  const { credit: creditEstimate, cost } = useMemo(() => estimateCredit(usdAmount), [usdAmount])
  const insufficient = tokenAmount > asset.balance

  const copyAddress = () => {
    if (verification.address) {
      navigator.clipboard?.writeText(verification.address).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const stages: TimelineStage[] = [
    {
      label: controls.payinVerification
        ? "WalletConnect relays verified ownership proof"
        : "WalletConnect relays connected wallet address",
      owner: "walletconnect",
    },
    { label: "WalletConnect receives funding request + source asset", owner: "walletconnect" },
    {
      label: "Sanctions & wallet-address screening",
      owner: controls.travelRulePayin ? "crossriver-wc" : "crossriver",
    },
    ...(controls.travelRulePayin
      ? [{ label: "Travel Rule originator data exchange", owner: "crossriver" as const }]
      : []),
    { label: controls.screeningDelay ? "Enhanced source-of-funds review" : "Source-of-funds risk scoring", owner: "crossriver" },
    { label: "Cross River compliance policy decision", owner: "crossriver" },
    { label: "Fintech credited to your balance", owner: "crossriver" },
  ]

  const willReject = controls.crossriverDecision === "reject"
  const decisionIndex = stages.findIndex((s) => s.label.includes("policy decision"))
  const stopIndex = willReject ? decisionIndex : undefined

  const startProcessing = () => {
    setPaused(false)
    setPhase("processing")
  }

  const handleComplete = () => {
    const ref = shortId("TOP")
    const r = {
      reference: ref,
      txHash: demoTxHash(),
      at: timestamp(),
      credit: creditEstimate,
      cost,
    }
    setReceipt(r)
    credit(creditEstimate, {
      id: ref,
      kind: "topup",
      status: "completed",
      detail: `Top-up from ${asset.symbol}`,
      network: asset.network,
    })
    setPhase("success")
  }

  const handleStopped = () => {
    const ref = shortId("TOP")
    setBlockReason(
      "Cross River's compliance policy declined this funding request. In production, Cross River would surface a specific reason code and any remediation steps.",
    )
    logOnly({
      id: ref,
      kind: "topup",
      status: "blocked",
      amount: usdAmount,
      detail: `Blocked top-up from ${asset.symbol}`,
      network: asset.network,
    })
    setTimeout(() => setPhase("blocked"), 600)
  }

  const restart = () => {
    setPhase("configure")
    setAcknowledged(false)
    setReceipt(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <StepIndicator current={phaseToStep(phase)} labels={STEP_LABELS} owners={STEP_OWNERS} />

      {/* STEP 1 — VERIFY / CONNECT */}
      {phase === "verify" ? (
        <StepCard
          step={1}
          title={controls.payinVerification ? "Verify wallet ownership" : "Connect wallet"}
          description={
            controls.payinVerification
              ? "Connect an external wallet and sign a WalletConnect ownership message. No funds move — this only proves you control the address."
              : "Connect an external wallet to fund from. Ownership verification is disabled for this demo, so no signature is required."
          }
        >
          {!isConnected ? (
            <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-border bg-muted/30 p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Wallet className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">No wallet connected</p>
                  <p className="text-sm text-muted-foreground">
                    Connect via WalletConnect to
                    {controls.payinVerification ? " begin ownership verification." : " continue."}
                  </p>
                </div>
              </div>
              <Button onClick={onConnectRequest} className="h-10">
                <Wallet className="size-4" /> Connect wallet
              </Button>
            </div>
          ) : controls.payinVerification ? (
            <WalletVerifyCard
              verification={verification}
              prompt="Sign the request in your wallet to prove you own this address. Cross River requires a fresh signature before crediting any funds."
              onCopy={copyAddress}
              copied={copied}
              attestation={{
                attested: ownershipAttested,
                requesting: attestRequesting,
                onAttest: handleAttest,
                label: "Sign wallet ownership proof",
              }}
            />
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Wallet className="size-4" />
                </span>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="flex items-center gap-1.5 font-mono text-sm font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {shortenAddress(verification.address)}
                    {copied ? <span className="text-[11px] text-primary">Copied</span> : null}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {chainLabel(verification.chainId)} · ownership check skipped
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Unverified
              </Badge>
            </div>
          )}

          {(controls.payinVerification ? ownershipAttested : isConnected) ? (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setPhase("configure")} className="h-10">
                Continue to funding <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : null}
        </StepCard>
      ) : null}

      {/* STEP 2 — CONFIGURE */}
      {phase === "configure" ? (
        <StepCard
          step={2}
          title="Choose funding source & amount"
          description="Fund your Fintech balance from any supported wallet asset. Rates and fees shown are illustrative."
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label className="text-xs tracking-wide text-muted-foreground uppercase">
                Funding asset
              </Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {FUNDING_ASSETS.map((a) => {
                  const selected = a.id === asset.id
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAsset(a)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-3 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-sm font-semibold text-secondary-foreground">
                          {a.symbol.slice(0, 2)}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{a.symbol}</span>
                          <span className="text-xs text-muted-foreground">{a.network}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Balance</div>
                        <div className="font-mono text-sm text-foreground">
                          {formatToken(a.balance, a.symbol)}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="topup-amount" className="text-xs tracking-wide text-muted-foreground uppercase">
                Amount (USD)
              </Label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="topup-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="h-11 pl-7 font-mono text-base"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(String(q))}
                    className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    {formatUsd(q)}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <InfoRow label="You pay" value={formatToken(tokenAmount, asset.symbol)} mono />
              <InfoRow label="Network cost & spread" value={formatUsd(cost)} mono />
              <div className="my-2 h-px bg-border" />
              <InfoRow label="Fintech credited" value={formatUsd(creditEstimate)} mono strong />
            </div>

            {insufficient ? (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <CircleAlert className="size-4" /> Insufficient {asset.symbol} balance for this
                amount.
              </p>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => setPhase("verify")} className="h-10">
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button
                onClick={() => setPhase("review")}
                disabled={usdAmount <= 0 || insufficient}
                className="h-10"
              >
                Review <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </StepCard>
      ) : null}

      {/* STEP 3 — REVIEW */}
      {phase === "review" ? (
        <StepCard
          step={3}
          title="Review & acknowledge"
          description="Confirm the details before Cross River screens and settles this top-up."
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <InfoRow label="From wallet" value={shortenAddress(verification.address)} mono />
              <InfoRow label="Source network" value={chainLabel(verification.chainId)} />
              <InfoRow label="Funding asset" value={asset.symbol} />
              <InfoRow label="You pay" value={formatToken(tokenAmount, asset.symbol)} mono />
              <InfoRow label="Estimated cost" value={formatUsd(cost)} mono />
              <div className="my-2 h-px bg-border" />
              <InfoRow label="Fintech credited" value={formatUsd(creditEstimate)} mono strong />
            </div>

            {controls.travelRulePayin ? (
              <TravelRuleFields
                value={travelRule}
                onChange={setTravelRule}
                description="This funding request exceeds the Travel Rule threshold. Cross River requires the originator's identity details before crediting funds."
              />
            ) : null}

            <DataRelayed
              rows={[
                {
                  label: controls.payinVerification ? "Verified address" : "Source address",
                  value: shortenAddress(verification.address),
                },
                {
                  label: "Ownership proof",
                  value: controls.payinVerification
                    ? "WalletConnect SIWX signature"
                    : "Not required (verification off)",
                },
                { label: "Source network", value: chainLabel(verification.chainId) },
                { label: "Requested credit", value: formatUsd(creditEstimate) },
                ...(controls.travelRulePayin
                  ? [
                      { label: "Originator name", value: travelRule.name || "—" },
                      { label: "Date of birth", value: travelRule.dob || "—" },
                      { label: "Nationality", value: travelRule.nationality || "—" },
                    ]
                  : []),
              ]}
            />

            <ResponsibilityNote>
              Cross River is solely responsible for compliance screening, sanctions checks, and the final
              decision to credit funds. WalletConnect only relays your verified ownership proof and
              never custodies assets or makes compliance determinations.
            </ResponsibilityNote>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <Checkbox
                checked={acknowledged}
                onCheckedChange={(v) => setAcknowledged(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm leading-relaxed text-foreground">
                I understand this is a demo, no real funds move, and Cross River controls the compliance
                outcome.
              </span>
            </label>

            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => setPhase("configure")} className="h-10">
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button
                onClick={startProcessing}
                disabled={!acknowledged || (controls.travelRulePayin && !isTravelRuleComplete(travelRule))}
                className="h-10"
              >
                Submit to Cross River <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </StepCard>
      ) : null}

      {/* STEP 4 — PROCESSING */}
      {phase === "processing" ? (
        <StepCard
          step={4}
          title="Cross River compliance screening"
          description="WalletConnect relays your verified proof; Cross River runs screening and makes the credit decision."
        >
          <div className="mb-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
            >
              {paused ? (
                <>
                  <Play className="size-3.5" /> Resume
                </>
              ) : (
                <>
                  <Pause className="size-3.5" /> Pause
                </>
              )}
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <FlowTimeline
              stages={stages}
              active
              paused={paused}
              stepDuration={controls.screeningDelay ? 1500 : 950}
              stopAtIndex={stopIndex}
              stopLabel="Blocked by Cross River compliance policy"
              onComplete={handleComplete}
              onStopped={handleStopped}
            />
          </div>
          {controls.screeningDelay ? (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" /> Enhanced review enabled — screening takes longer.
            </p>
          ) : null}
        </StepCard>
      ) : null}

      {/* STEP 5 — SUCCESS */}
      {phase === "success" && receipt ? (
        <StepCard
          step={<Check className="size-4" />}
          title="Top-up complete"
          description="Cross River approved and credited your Fintech balance."
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Coins className="size-5" />
              </span>
              <div>
                <div className="text-2xl font-semibold text-foreground">
                  {formatUsd(receipt.credit)}
                </div>
                <div className="text-sm text-muted-foreground">credited to Fintech</div>
              </div>
              <Badge className="ml-auto gap-1 bg-primary/10 text-primary">
                <Check className="size-3" /> Settled
              </Badge>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <InfoRow label="Reference" value={receipt.reference} mono />
              <InfoRow label="Settlement tx" value={shortenAddress(receipt.txHash)} mono />
              <InfoRow label="Funded with" value={formatToken(tokenAmount, asset.symbol)} mono />
              <InfoRow label="Completed" value={receipt.at} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={restart} className="h-10">
                <RefreshCw className="size-4" /> New top-up
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigator.clipboard?.writeText(receipt.txHash).catch(() => {})}
                className="h-10"
              >
                <Copy className="size-4" /> Copy tx hash
              </Button>
            </div>
          </div>
        </StepCard>
      ) : null}

      {/* STEP 5 — BLOCKED */}
      {phase === "blocked" ? (
        <StepCard
          step={<CircleAlert className="size-4" />}
          title="Top-up blocked by Cross River"
          description="Cross River declined this funding request during compliance screening."
          className="border-destructive/30"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <CircleAlert className="mt-0.5 size-5 text-destructive" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-destructive">
                  Compliance decision: declined
                </span>
                <p className="text-sm text-muted-foreground">{blockReason}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <FileText className="size-3.5" /> Your wallet ownership proof remains valid — only the
              funding decision was declined.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={restart} className="h-10">
                <RefreshCw className="size-4" /> Try a different amount
              </Button>
            </div>
          </div>
        </StepCard>
      ) : null}
    </div>
  )
}
