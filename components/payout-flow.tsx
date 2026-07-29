"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAppKitAccount } from "@reown/appkit/react"
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpFromLine,
  Check,
  CircleAlert,
  Clock,
  Copy,
  FileText,
  Pause,
  Play,
  RefreshCw,
  ShieldAlert,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  PAYOUT_NETWORKS,
  PAYOUT_TOKENS,
  QUICK_AMOUNTS,
  formatUsd,
  chainLabel,
  shortenAddress,
  shortId,
  demoTxHash,
  timestamp,
  EMPTY_TRAVEL_RULE,
  isTravelRuleComplete,
  type TravelRuleData,
} from "@/lib/demo"

type Phase = "verify" | "configure" | "review" | "processing" | "success" | "blocked" | "review_hold"

const STEP_LABELS = ["Verify", "Amount", "Compliance review", "Settle"]

function phaseToStep(phase: Phase): number {
  switch (phase) {
    case "verify":
      return 0
    case "configure":
      return 1
    // Acknowledgement, active screening, holds, and blocks all live inside
    // the "Compliance review" step.
    case "review":
    case "processing":
    case "review_hold":
    case "blocked":
      return 2
    // Settlement only completes after Cross River approves, so success marks every
    // step — including "Settle" — as done.
    case "success":
      return 4
    default:
      return 2
  }
}

const PAYOUT_FEE = 1.5

export function PayoutFlow({ onConnectRequest }: { onConnectRequest: () => void }) {
  const { isConnected } = useAppKitAccount()
  const verification = useWalletVerification()
  const controls = useDemoControls()
  const { balance, debit, logOnly } = useAccount()

  const [phase, setPhase] = useState<Phase>("verify")
  const [amount, setAmount] = useState<string>("500")
  const [network, setNetwork] = useState<string>(String(PAYOUT_NETWORKS[0].chainId))
  const [token, setToken] = useState<string>(PAYOUT_TOKENS[0].id)
  const [travelRule, setTravelRule] = useState<TravelRuleData>(EMPTY_TRAVEL_RULE)
  const [acknowledged, setAcknowledged] = useState(false)
  const [copied, setCopied] = useState(false)
  const [paused, setPaused] = useState(false)
  // Explicit beneficiary ownership attestation — a fresh SIWX signature is
  // required here even if a session already exists from the Top-Up flow.
  const [beneficiaryAttested, setBeneficiaryAttested] = useState(false)
  const [attestRequesting, setAttestRequesting] = useState(false)
  const attestRequestedRef = useRef(false)
  const [receipt, setReceipt] = useState<{
    reference: string
    txHash: string
    at: string
    net: number
  } | null>(null)

  const resetAttestation = useCallback(() => {
    setBeneficiaryAttested(false)
    setAttestRequesting(false)
    attestRequestedRef.current = false
  }, [])

  useEffect(() => {
    setPhase("verify")
    setAcknowledged(false)
    setReceipt(null)
    setTravelRule(EMPTY_TRAVEL_RULE)
    setToken(PAYOUT_TOKENS[0].id)
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
  // confirms the beneficiary attestation.
  useEffect(() => {
    if (attestRequestedRef.current && verification.verified) {
      setBeneficiaryAttested(true)
      setAttestRequesting(false)
    }
  }, [verification.verified])

  const handleAttest = useCallback(async () => {
    attestRequestedRef.current = true
    setBeneficiaryAttested(false)
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

  const netAmount = Math.max(0, usdAmount - PAYOUT_FEE)
  const insufficient = usdAmount > balance
  const networkLabel = chainLabel(Number.parseInt(network, 10))
  const tokenSymbol = (PAYOUT_TOKENS.find((t) => t.id === token) ?? PAYOUT_TOKENS[0]).symbol
  const receiveLabel = `${formatUsd(netAmount)} ${tokenSymbol}`

  const copyAddress = () => {
    if (verification.address) {
      navigator.clipboard?.writeText(verification.address).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const stages: TimelineStage[] = [
    {
      label: controls.payoutVerification
        ? "WalletConnect relays verified beneficiary proof"
        : "WalletConnect relays connected beneficiary address",
      owner: "walletconnect",
    },
    { label: "Cross River receives payout instruction", owner: "crossriver" },
    { label: "Sanctions & destination-address screening", owner: "crossriver" },
    ...(controls.travelRulePayout
      ? [{ label: "Travel Rule originator/beneficiary data exchange", owner: "crossriver" as const }]
      : []),
    {
      label: controls.beneficiaryMismatch
        ? "Beneficiary name match — mismatch detected"
        : "Beneficiary name match",
      owner: "crossriver",
    },
    { label: "Cross River compliance policy decision", owner: "crossriver" },
    { label: "Cross River debited & sent on-chain", owner: "crossriver-wc" },
  ]

  // Determine outcome + stop index.
  const outcome: "approve" | "reject" | "hold" =
    controls.crossriverDecision === "reject"
      ? "reject"
      : controls.beneficiaryMismatch
        ? "hold"
        : "approve"

  // Index of the policy-decision stage.
  const decisionIndex = stages.findIndex((s) => s.label.includes("policy decision"))
  const beneficiaryIndex = stages.findIndex((s) => s.label.startsWith("Beneficiary name match"))
  const stopIndex =
    outcome === "reject" ? decisionIndex : outcome === "hold" ? beneficiaryIndex : undefined

  const handleComplete = () => {
    const ref = shortId("PAY")
    const r = { reference: ref, txHash: demoTxHash(), at: timestamp(), net: netAmount }
    setReceipt(r)
    debit(usdAmount, {
      id: ref,
      kind: "payout",
      status: "completed",
      detail: `Payout to ${shortenAddress(verification.address)}`,
      network: networkLabel,
    })
    setPhase("success")
  }

  const handleStopped = () => {
    const ref = shortId("PAY")
    if (outcome === "hold") {
      logOnly({
        id: ref,
        kind: "payout",
        status: "review",
        amount: usdAmount,
        detail: `Payout held — beneficiary mismatch`,
        network: networkLabel,
      })
      setTimeout(() => setPhase("review_hold"), 600)
    } else {
      logOnly({
        id: ref,
        kind: "payout",
        status: "blocked",
        amount: usdAmount,
        detail: `Blocked payout to ${shortenAddress(verification.address)}`,
        network: networkLabel,
      })
      setTimeout(() => setPhase("blocked"), 600)
    }
  }

  const restart = () => {
    setPhase("configure")
    setAcknowledged(false)
    setReceipt(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <StepIndicator current={phaseToStep(phase)} labels={STEP_LABELS} />

      {/* STEP 1 — VERIFY / CONNECT DESTINATION */}
      {phase === "verify" ? (
        <StepCard
          step={1}
          title={controls.payoutVerification ? "Verify beneficiary wallet" : "Connect beneficiary wallet"}
          description={
            controls.payoutVerification
              ? "Connect the external wallet that will receive the payout and sign a fresh SIWX proof. The beneficiary must prove ownership of the destination address before any funds leave Cross River."
              : "Connect the external wallet that will receive the payout. Ownership verification is disabled for this demo, so no signature is required."
          }
        >
          {!isConnected ? (
            <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-border bg-muted/30 p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Wallet className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">No destination wallet</p>
                  <p className="text-sm text-muted-foreground">
                    Connect the receiving wallet via WalletConnect to
                    {controls.payoutVerification ? " verify the beneficiary." : " continue."}
                  </p>
                </div>
              </div>
              <Button onClick={onConnectRequest} className="h-10">
                <Wallet className="size-4" /> Connect destination wallet
              </Button>
            </div>
          ) : controls.payoutVerification ? (
            <WalletVerifyCard
              verification={verification}
              prompt="Sign the request with the destination wallet to prove you own this beneficiary address. A fresh signature is required for every payout — Cross River will only release funds to a freshly proven destination."
              onCopy={copyAddress}
              copied={copied}
              attestation={{
                attested: beneficiaryAttested,
                requesting: attestRequesting,
                onAttest: handleAttest,
              }}
              verifiedTitle="Beneficiary ownership verified"
              evidenceLabel="Beneficiary ownership proof relayed to Cross River."
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

          {(controls.payoutVerification ? beneficiaryAttested : isConnected) ? (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setPhase("configure")} className="h-10">
                Continue to amount <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : null}
        </StepCard>
      ) : null}

      {/* STEP 2 — CONFIGURE */}
      {phase === "configure" ? (
        <StepCard
          step={2}
          title="Payout amount & network"
          description="Withdraw Cross River to your verified external wallet."
        >
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
              <span className="text-sm text-muted-foreground">Available Cross River</span>
              <span className="font-mono text-base font-semibold text-foreground">
                {formatUsd(balance)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="payout-amount" className="text-xs tracking-wide text-muted-foreground uppercase">
                Amount (USD)
              </Label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="payout-amount"
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

            <div className="flex flex-col gap-2">
              <Label className="text-xs tracking-wide text-muted-foreground uppercase">
                Payout token
              </Label>
              <Select value={token} onValueChange={(v) => setToken(v ?? token)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYOUT_TOKENS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs tracking-wide text-muted-foreground uppercase">
                Destination network
              </Label>
              <Select value={network} onValueChange={(v) => setNetwork(v ?? network)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYOUT_NETWORKS.map((n) => (
                    <SelectItem key={n.chainId} value={String(n.chainId)}>
                      {n.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {tokenSymbol} is sent to {shortenAddress(verification.address)} on {networkLabel}.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <InfoRow label="Payout amount" value={formatUsd(usdAmount)} mono />
              <InfoRow label="Network fee" value={formatUsd(PAYOUT_FEE)} mono />
              <div className="my-2 h-px bg-border" />
              <InfoRow label="Beneficiary receives" value={receiveLabel} mono strong />
            </div>

            {insufficient ? (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <CircleAlert className="size-4" /> Amount exceeds your Cross River balance.
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
          description="Confirm the payout details before Cross River screens and settles the withdrawal."
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <InfoRow label="Destination" value={shortenAddress(verification.address)} mono />
              <InfoRow label="Token" value={tokenSymbol} />
              <InfoRow label="Network" value={networkLabel} />
              <InfoRow label="Payout amount" value={formatUsd(usdAmount)} mono />
              <InfoRow label="Network fee" value={formatUsd(PAYOUT_FEE)} mono />
              <div className="my-2 h-px bg-border" />
              <InfoRow label="Beneficiary receives" value={receiveLabel} mono strong />
            </div>

            {controls.travelRulePayout ? (
              <TravelRuleFields
                value={travelRule}
                onChange={setTravelRule}
                description="This payout exceeds the Travel Rule threshold. Cross River requires the beneficiary's identity details to exchange with the receiving institution."
              />
            ) : null}

            <DataRelayed
              rows={[
                { label: "Beneficiary address", value: shortenAddress(verification.address) },
                {
                  label: "Ownership proof",
                  value: controls.payoutVerification
                    ? "WalletConnect SIWX signature"
                    : "Not required (verification off)",
                },
                { label: "Payout token", value: tokenSymbol },
                { label: "Destination network", value: networkLabel },
                { label: "Payout amount", value: formatUsd(usdAmount) },
                ...(controls.travelRulePayout
                  ? [
                      { label: "Beneficiary name", value: travelRule.name || "—" },
                      { label: "Date of birth", value: travelRule.dob || "—" },
                      { label: "Nationality", value: travelRule.nationality || "—" },
                    ]
                  : []),
              ]}
            />

            <ResponsibilityNote>
              Cross River is solely responsible for Travel Rule compliance, sanctions screening, and the
              final decision to release this payout. WalletConnect only relays verified beneficiary
              ownership proof and never controls the movement of funds.
            </ResponsibilityNote>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <Checkbox
                checked={acknowledged}
                onCheckedChange={(v) => setAcknowledged(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm leading-relaxed text-foreground">
                I confirm this is a demo, the destination is correct, and Cross River controls the
                compliance outcome.
              </span>
            </label>

            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => setPhase("configure")} className="h-10">
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button
                onClick={() => {
                  setPaused(false)
                  setPhase("processing")
                }}
                disabled={
                  !acknowledged || (controls.travelRulePayout && !isTravelRuleComplete(travelRule))
                }
                className="h-10"
              >
                Submit payout <ArrowRight className="size-4" />
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
          description="WalletConnect relays the verified beneficiary proof; Cross River runs screening, Travel Rule, and the release decision."
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
              stopLabel={
                outcome === "hold"
                  ? "Held for manual review — beneficiary mismatch"
                  : "Blocked by Cross River compliance policy"
              }
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
          title="Payout sent"
          description="Cross River released the payout to your verified external wallet."
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <ArrowUpFromLine className="size-5" />
              </span>
              <div>
                <div className="text-2xl font-semibold text-foreground">
                  {formatUsd(receipt.net)} {tokenSymbol}
                </div>
                <div className="text-sm text-muted-foreground">
                  sent to {shortenAddress(verification.address)}
                </div>
              </div>
              <Badge className="ml-auto gap-1 bg-primary/10 text-primary">
                <Check className="size-3" /> Sent
              </Badge>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <InfoRow label="Reference" value={receipt.reference} mono />
              <InfoRow label="On-chain tx" value={shortenAddress(receipt.txHash)} mono />
              <InfoRow label="Token" value={tokenSymbol} />
              <InfoRow label="Network" value={networkLabel} />
              <InfoRow label="Completed" value={receipt.at} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={restart} className="h-10">
                <RefreshCw className="size-4" /> New payout
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

      {/* STEP 5 — HELD FOR REVIEW */}
      {phase === "review_hold" ? (
        <StepCard
          step={<ShieldAlert className="size-4" />}
          title="Held for manual review"
          description="Cross River flagged a beneficiary name mismatch and paused the payout."
          className="border-accent"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-xl border border-accent bg-accent/40 p-4">
              <ShieldAlert className="mt-0.5 size-5 text-accent-foreground" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-accent-foreground">
                  Pending compliance review
                </span>
                <p className="text-sm text-muted-foreground">
                  The beneficiary name did not match Cross River&apos;s records for this destination. No
                  funds were debited. Cross River would typically request additional verification before
                  releasing the payout.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <FileText className="size-3.5" /> Your beneficiary ownership proof remains valid — only
              the release is paused.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={restart} className="h-10">
                <RefreshCw className="size-4" /> Edit & resubmit
              </Button>
            </div>
          </div>
        </StepCard>
      ) : null}

      {/* STEP 5 — BLOCKED */}
      {phase === "blocked" ? (
        <StepCard
          step={<CircleAlert className="size-4" />}
          title="Payout blocked by Cross River"
          description="Cross River declined this payout during compliance screening."
          className="border-destructive/30"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <CircleAlert className="mt-0.5 size-5 text-destructive" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-destructive">
                  Compliance decision: declined
                </span>
                <p className="text-sm text-muted-foreground">
                  Cross River&apos;s compliance policy declined this payout. No funds were debited. In
                  production, Cross River would surface a specific reason code and remediation path.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <FileText className="size-3.5" /> Your beneficiary ownership proof remains valid — only
              the payout decision was declined.
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
