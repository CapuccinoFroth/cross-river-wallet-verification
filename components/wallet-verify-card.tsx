"use client"

import { useMemo } from "react"
import { useAppKit, useDisconnect } from "@reown/appkit/react"
import { ShieldCheck, Loader2, CircleAlert, Copy, Wallet, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { chainLabel, shortenAddress, shortId } from "@/lib/demo"
import type { WalletVerification } from "@/hooks/use-wallet-verification"

export function WalletVerifyCard({
  verification,
  prompt,
  rejected,
  onCopy,
  copied,
  attestation,
  verifiedTitle = "Wallet ownership verified",
  evidenceLabel = "Verification evidence relayed to CrossRiver.",
}: {
  verification: WalletVerification
  prompt: string
  rejected?: boolean
  onCopy?: () => void
  copied?: boolean
  /**
   * When provided, the card requires an explicit signature action (used for
   * beneficiary attestation) instead of trusting a pre-existing SIWX session.
   */
  attestation?: {
    attested: boolean
    requesting: boolean
    onAttest: () => void
    label?: string
  }
  verifiedTitle?: string
  evidenceLabel?: string
}) {
  const { open } = useAppKit()
  const { disconnect } = useDisconnect()
  const { address, chainId, verified, checking, verifiedAt } = verification

  // In attestation mode the "verified" state is driven by the explicit
  // beneficiary signature, not by any reused session.
  const showVerified = attestation ? attestation.attested : verified
  const waiting = attestation ? attestation.requesting : checking

  // Stable verification ID derived from the moment verification succeeded.
  const verificationId = useMemo(
    () => (verifiedAt ? shortId("WCV") : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [verifiedAt],
  )

  const verifiedTime = useMemo(
    () =>
      verifiedAt
        ? new Date(verifiedAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : null,
    [verifiedAt],
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Connected wallet summary */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="size-4" />
          </span>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={onCopy}
              className="flex items-center gap-1.5 font-mono text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              {shortenAddress(address)}
              <Copy className="size-3 text-muted-foreground" />
              {copied ? <span className="text-[11px] text-primary">Copied</span> : null}
            </button>
            <span className="text-xs text-muted-foreground">{chainLabel(chainId)}</span>
          </div>
        </div>
        {showVerified ? (
          <Badge className="gap-1 bg-primary/10 text-primary">
            <ShieldCheck className="size-3" /> Verified
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1">
            {waiting ? <Loader2 className="size-3 animate-spin" /> : null}
            {waiting ? "Verifying" : "Required"}
          </Badge>
        )}
      </div>

      {showVerified ? (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-5" />
            <span className="text-sm font-semibold">{verifiedTitle}</span>
          </div>
          <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
            <dt className="text-muted-foreground">Verified at</dt>
            <dd className="text-right font-medium text-foreground">{verifiedTime}</dd>
            <dt className="text-muted-foreground">Verification ID</dt>
            <dd className="text-right font-mono font-medium text-foreground">{verificationId}</dd>
          </dl>
          <p className="text-[11px] text-muted-foreground">{evidenceLabel}</p>
          <button
            type="button"
            onClick={() => open()}
            className="self-start text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Verify a different wallet
          </button>
        </div>
      ) : rejected ? (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <CircleAlert className="size-5" />
            <span className="text-sm font-semibold">Signature was not completed</span>
          </div>
          <p className="text-xs text-muted-foreground">
            You declined or dismissed the wallet signature. Ownership could not be verified.
          </p>
          <Button onClick={() => open()} className="self-start h-9">
            <RefreshCw className="size-4" /> Retry verification
          </Button>
        </div>
      ) : attestation && !attestation.requesting ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{prompt}</p>
          <Button onClick={attestation.onAttest} className="self-start h-9">
            <ShieldCheck className="size-4" /> {attestation.label ?? "Sign beneficiary ownership proof"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{prompt}</p>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="font-medium">Waiting for wallet signature</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => (attestation ? attestation.onAttest() : open())}
              variant="outline"
              className="h-9"
            >
              <RefreshCw className="size-4" /> Re-request signature
            </Button>
            <Button onClick={() => disconnect()} variant="ghost" className="h-9">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
