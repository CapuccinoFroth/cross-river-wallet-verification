"use client"

import { useState } from "react"
import { useAppKit } from "@reown/appkit/react"
import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { TopUpFlow } from "@/components/topup-flow"
import { PayoutFlow } from "@/components/payout-flow"
import { CompliancePanel } from "@/components/compliance-panel"
import { ActivityPanel } from "@/components/activity-panel"
import { DemoControlsPanel } from "@/components/demo-controls-panel"
import { isReownConfigured } from "@/context/appkit-provider"
import { cn } from "@/lib/utils"

type TabKey = "topup" | "payout"

export default function Page() {
  const [tab, setTab] = useState<TabKey>("topup")
  const [controlsOpen, setControlsOpen] = useState(true)

  // useAppKit returns a no-op-safe object; only call open() when configured.
  const appkit = useAppKit()
  const requestConnect = () => {
    if (isReownConfigured) appkit.open()
  }

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />

      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8 md:px-6 md:py-10">
        <Hero />

        <div
          className={cn(
            "grid grid-cols-1 gap-6",
            controlsOpen
              ? "lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_320px]"
              : "lg:grid-cols-[minmax(0,1fr)_320px]",
          )}
        >
          {/* Left sidebar — demo controls (toggleable) */}
          {controlsOpen ? (
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <DemoControlsPanel onClose={() => setControlsOpen(false)} />
            </aside>
          ) : null}

          {/* Primary flow column */}
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-auto">
                <TabsList className="h-auto grid-cols-2 gap-1 bg-muted p-1 sm:inline-grid">
                  <TabsTrigger
                    value="topup"
                    className="h-9 gap-2 px-4 font-medium text-brand-teal! data-active:bg-brand-teal! data-active:text-primary-foreground! data-active:shadow-sm"
                  >
                    <ArrowDownToLine className="size-4" />
                    Universal Top-Up
                  </TabsTrigger>
                  <TabsTrigger
                    value="payout"
                    className="h-9 gap-2 px-4 font-medium text-brand-teal! data-active:bg-brand-teal! data-active:text-primary-foreground! data-active:shadow-sm"
                  >
                    <ArrowUpFromLine className="size-4" />
                    Payout to Wallet
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {!controlsOpen ? (
                <Button
                  variant="outline"
                  className="h-9"
                  onClick={() => setControlsOpen(true)}
                >
                  <SlidersHorizontal className="size-4" /> Demo controls
                </Button>
              ) : null}
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
              <TabsContent value="topup" className="mt-0">
                <TopUpFlow onConnectRequest={requestConnect} />
              </TabsContent>
              <TabsContent value="payout" className="mt-0">
                <PayoutFlow onConnectRequest={requestConnect} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right rail — activity & compliance */}
          <aside
            className={cn(
              "flex flex-col gap-5",
              controlsOpen ? "lg:col-span-2 xl:col-span-1" : "",
            )}
          >
            <ActivityPanel />
            <CompliancePanel variant={tab} />
          </aside>
        </div>

        <footer className="border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
          <p className="text-pretty">
            Cross River is a concept prototype for demonstration only. No real funds move, balances are
            illustrative, and compliance outcomes are simulated with the demo controls. Wallet
            connection and ownership verification use live WalletConnect / Reown AppKit with SIWX.
          </p>
        </footer>
      </main>
    </div>
  )
}
