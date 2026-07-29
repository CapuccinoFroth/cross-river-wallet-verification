"use client"

import { useState } from "react"
import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react"
import { Wallet, ShieldCheck, Power, Copy, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWalletVerification } from "@/hooks/use-wallet-verification"
import { chainLabel, shortenAddress } from "@/lib/demo"
import { isReownConfigured } from "@/context/appkit-provider"
import { cn } from "@/lib/utils"

export function WalletControl() {
  const { open } = useAppKit()
  const { isConnected, address } = useAppKitAccount()
  const { disconnect } = useDisconnect()
  const { verified, checking, chainId } = useWalletVerification()
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  if (!isReownConfigured) {
    return (
      <Badge variant="outline" className="gap-1.5 py-1">
        <Wallet className="size-3" />
        Wallet setup required
      </Badge>
    )
  }

  if (!isConnected) {
    return (
      <Button onClick={() => open()} className="h-9 px-4">
        <Wallet className="size-4" />
        Connect wallet
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 ring-1 ring-foreground/5">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyAddress}
            className="flex items-center gap-1 font-mono text-sm font-medium text-foreground transition-colors hover:text-primary"
            aria-label="Copy wallet address"
          >
            {shortenAddress(address)}
            {copied ? (
              <Check className="size-3 text-primary" />
            ) : (
              <Copy className="size-3 text-muted-foreground" />
            )}
          </button>
          <span className="text-xs text-muted-foreground">{chainLabel(chainId)}</span>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 text-[11px] font-medium",
            verified ? "text-primary" : "text-muted-foreground",
          )}
        >
          {verified ? (
            <>
              <ShieldCheck className="size-3" /> Ownership verified
            </>
          ) : checking ? (
            <>
              <Loader2 className="size-3 animate-spin" /> Awaiting signature
            </>
          ) : (
            <>Verification required</>
          )}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => disconnect()}
        aria-label="Disconnect wallet"
      >
        <Power className="size-4" />
      </Button>
    </div>
  )
}
