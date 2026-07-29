"use client"

import React, { type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createAppKit } from "@reown/appkit/react"
import { mainnet, base, arbitrum, optimism, polygon } from "@reown/appkit/networks"
import { ConditionalSIWX } from "@/lib/conditional-siwx"
import { WagmiProvider, cookieToInitialState, type Config } from "wagmi"
import { wagmiAdapter, projectId } from "@/config"
import { DemoControlsProvider } from "@/context/demo-controls"
import { AccountProvider } from "@/context/account"

const queryClient = new QueryClient()

export const isReownConfigured = Boolean(projectId)

const appUrl = "https://crossriver-demo.vercel.app"

const metadata = {
  name: "Cross River Demo",
  description: "Cross River wallet verification and payment demo",
  url: appUrl,
  icons: [`${appUrl}/appkit-icon.png`],
}

// Initialize AppKit at module scope (server + client) so the AppKit hooks
// are always available. A placeholder project ID keeps init from crashing;
// live wallet actions are gated behind `isReownConfigured` in the UI, and a
// SetupCard prompts the user to add the real project ID.
createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId ?? "MISSING_PROJECT_ID",
  networks: [base, mainnet, arbitrum, optimism, polygon],
  defaultNetwork: base,
  metadata,
  siwx: new ConditionalSIWX(),
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#1176d1",
    "--w3m-border-radius-master": "3px",
  },
})

export function AppKitProvider({
  children,
  cookies,
}: {
  children: ReactNode
  cookies: string | null
}) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <DemoControlsProvider>
          <AccountProvider>{children}</AccountProvider>
        </DemoControlsProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
