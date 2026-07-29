import { cookieStorage, createStorage } from "wagmi"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { mainnet, base, arbitrum, optimism, polygon } from "@reown/appkit/networks"
import type { AppKitNetwork } from "@reown/appkit/networks"

// Reown project ID is required for real wallet connectivity.
// Get one at https://dashboard.reown.com
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID

// The networks supported by the CrossRiverUSD demo.
export const networks = [base, mainnet, arbitrum, optimism, polygon] as [
  AppKitNetwork,
  ...AppKitNetwork[],
]

// Set up the Wagmi Adapter (config). Guarded so a missing project ID
// does not crash module evaluation — the UI surfaces a setup card instead.
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId: projectId ?? "MISSING_PROJECT_ID",
  networks,
})

export const wagmiConfig = wagmiAdapter.wagmiConfig
