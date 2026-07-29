"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react"
import { useAppKitSIWX } from "@reown/appkit-siwx/react"
import { SIWXUtil } from "@reown/appkit-controllers"

export interface WalletVerification {
  address?: string
  isConnected: boolean
  chainId?: number
  caipNetworkId?: string
  /** SIWX ownership signature confirmed for the current address + network. */
  verified: boolean
  /** Actively polling for a SIWX session (waiting for the signature). */
  checking: boolean
  verifiedAt: number | null
  /**
   * Forces a brand-new SIWX ownership signature: any reused session for this
   * address is revoked first, then a fresh signature is requested. Used to
   * make a beneficiary explicitly re-prove ownership even if a session already
   * exists from another flow.
   */
  requestFreshSignature: () => Promise<void>
}

/**
 * Tracks real Reown SIWX ownership verification for the connected wallet.
 * DefaultSIWX prompts for a signature on connect and on network change; we
 * poll the SIWX session store to know when ownership has been proven.
 */
export function useWalletVerification(): WalletVerification {
  const { address, isConnected } = useAppKitAccount()
  const { chainId, caipNetworkId } = useAppKitNetwork()
  const siwx = useAppKitSIWX()

  const [verified, setVerified] = useState(false)
  const [checking, setChecking] = useState(false)
  const [verifiedAt, setVerifiedAt] = useState<number | null>(null)
  const verifiedAtRef = useRef<number | null>(null)

  useEffect(() => {
    // Reset whenever the identity that must be verified changes.
    setVerified(false)
    verifiedAtRef.current = null
    setVerifiedAt(null)

    if (!isConnected || !address || !caipNetworkId || !siwx) {
      setChecking(false)
      return
    }

    let cancelled = false
    setChecking(true)

    const check = async () => {
      try {
        // Prefer real (non-suppressed) sessions so we only mark ownership
        // verified once the user has completed an actual SIWX signature.
        const getReal = (
          siwx as { getRealSessions?: typeof siwx.getSessions }
        ).getRealSessions?.bind(siwx)
        const readSessions = getReal ?? siwx.getSessions.bind(siwx)
        const sessions = await readSessions(
          caipNetworkId as Parameters<typeof siwx.getSessions>[0],
          address,
        )
        if (!cancelled && sessions.length > 0) {
          setVerified(true)
          if (verifiedAtRef.current == null) {
            verifiedAtRef.current = Date.now()
            setVerifiedAt(verifiedAtRef.current)
          }
          setChecking(false)
        }
      } catch {
        // SIWX not ready yet — keep polling.
      }
    }

    check()
    const interval = setInterval(check, 700)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [isConnected, address, caipNetworkId, siwx])

  const requestFreshSignature = useCallback(async () => {
    if (!address || !caipNetworkId || !siwx) return
    // Clear any session reused from another flow so the wallet is forced to
    // sign again for this specific attestation.
    try {
      await siwx.revokeSession(caipNetworkId as Parameters<typeof siwx.revokeSession>[0], address)
    } catch {
      // No existing session to revoke — proceed to request a new one.
    }
    setVerified(false)
    verifiedAtRef.current = null
    setVerifiedAt(null)
    setChecking(true)
    // Prompt the connected wallet for a fresh SIWX signature.
    await SIWXUtil.requestSignMessage()
  }, [address, caipNetworkId, siwx])

  return {
    address,
    isConnected,
    chainId: typeof chainId === "string" ? Number.parseInt(chainId, 10) : chainId,
    caipNetworkId: caipNetworkId as string | undefined,
    verified,
    checking,
    verifiedAt,
    requestFreshSignature,
  }
}
