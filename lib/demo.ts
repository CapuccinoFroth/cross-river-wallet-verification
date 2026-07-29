// Shared demo constants, types, and helpers for the Cross River prototype.
// None of this moves real funds — all balances and estimates are illustrative.

export const INITIAL_CROSSRIVERUSD_BALANCE = 4250.0

export type ChainId = 8453 | 1 | 42161 | 10 | 137

export const CHAIN_LABELS: Record<number, string> = {
  8453: "Base",
  1: "Ethereum",
  42161: "Arbitrum",
  10: "Optimism",
  137: "Polygon",
}

export function chainLabel(chainId?: number | string | null): string {
  if (chainId == null) return "Unknown network"
  const id = typeof chainId === "string" ? Number.parseInt(chainId, 10) : chainId
  return CHAIN_LABELS[id] ?? `Chain ${chainId}`
}

export function shortenAddress(address?: string | null): string {
  if (!address) return "—"
  if (address.length < 12) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

// A masked demo address used in review/receipt copy so the UI is legible
// even before a real wallet connects. Real connected addresses are shown live.
export const DEMO_MASKED_ADDRESS = "0x12A4…92F1"

export function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatToken(value: number, symbol: string): string {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })} ${symbol}`
}

export function shortId(prefix: string): string {
  const hex = Array.from({ length: 6 }, () =>
    "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16)),
  ).join("")
  return `${prefix}-${hex}`
}

export function demoTxHash(): string {
  const hex = Array.from({ length: 40 }, () =>
    "0123456789abcdef".charAt(Math.floor(Math.random() * 16)),
  ).join("")
  return `0x${hex}`
}

export function timestamp(): string {
  return new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

// Eligible funding assets for Top-Up. Balances are mocked because the
// payment-routing backend is a demo.
export interface FundingAsset {
  id: string
  symbol: string
  balance: number
  network: string
  chainId: number
  // conversion rate to Cross River (illustrative)
  rate: number
}

export const FUNDING_ASSETS: FundingAsset[] = [
  { id: "crossriver-base", symbol: "Cross River", balance: 1200, network: "Base", chainId: 8453, rate: 1 },
  { id: "usdc-base", symbol: "USDC", balance: 420, network: "Base", chainId: 8453, rate: 0.997 },
  { id: "eth-eth", symbol: "ETH", balance: 0.18, network: "Ethereum", chainId: 1, rate: 3350 },
  { id: "usdt-arb", symbol: "USDT", balance: 210, network: "Arbitrum", chainId: 42161, rate: 0.996 },
  { id: "eurc-base", symbol: "EURC", balance: 175, network: "Base", chainId: 8453, rate: 1.078 },
]

// Estimated Cross River credit for a given USD amount funded from an asset.
export function estimateCredit(usdAmount: number): { credit: number; cost: number } {
  const cost = Math.max(0.75, usdAmount * 0.003)
  return { credit: Math.max(0, usdAmount - cost), cost }
}

// Travel Rule beneficiary/originator data collected when the rule is enabled
// for a flow. Illustrative only — no real personal data is stored.
export interface TravelRuleData {
  name: string
  dob: string
  nationality: string
}

export const EMPTY_TRAVEL_RULE: TravelRuleData = {
  name: "",
  dob: "",
  nationality: "",
}

export function isTravelRuleComplete(data: TravelRuleData): boolean {
  return (
    data.name.trim().length >= 2 &&
    data.dob.trim().length > 0 &&
    data.nationality.trim().length >= 2
  )
}

export const PAYOUT_NETWORKS = [
  { chainId: 8453, label: "Base" },
  { chainId: 1, label: "Ethereum" },
  { chainId: 42161, label: "Arbitrum" },
  { chainId: 137, label: "Polygon" },
]

// Tokens a beneficiary can receive on a payout. All are USD-pegged, so the
// received amount is 1:1 with the USD payout amount (illustrative).
export interface PayoutToken {
  id: string
  symbol: string
}

export const PAYOUT_TOKENS: PayoutToken[] = [
  { id: "crossriver", symbol: "Cross River" },
  { id: "usdc", symbol: "USDC" },
  { id: "usdt", symbol: "USDT" },
]

export const QUICK_AMOUNTS = [100, 250, 500, 1000]
