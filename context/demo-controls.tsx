"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"

export interface DemoControlsState {
  // "approve" | "reject" — the final Cross River policy decision
  crossriverDecision: "approve" | "reject"
  screeningDelay: boolean
  // Wallet ownership verification (SIWX) requirement, per flow.
  payinVerification: boolean
  payoutVerification: boolean
  // Travel Rule identity data requirement, per flow.
  travelRulePayin: boolean
  travelRulePayout: boolean
  beneficiaryMismatch: boolean
}

const DEFAULT_STATE: DemoControlsState = {
  crossriverDecision: "approve",
  screeningDelay: false,
  payinVerification: true,
  payoutVerification: true,
  travelRulePayin: false,
  travelRulePayout: false,
  beneficiaryMismatch: false,
}

const STORAGE_KEY = "crossriver-demo-controls"

interface DemoControlsContextValue extends DemoControlsState {
  setControl: <K extends keyof DemoControlsState>(key: K, value: DemoControlsState[K]) => void
  resetSignal: number
  resetDemo: () => void
}

const DemoControlsContext = createContext<DemoControlsContextValue | null>(null)

export function DemoControlsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoControlsState>(DEFAULT_STATE)
  const [resetSignal, setResetSignal] = useState(0)
  const [hydrated, setHydrated] = useState(false)

  // Persist only harmless demo toggles in localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setState({ ...DEFAULT_STATE, ...JSON.parse(raw) })
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state, hydrated])

  const setControl = useCallback(
    <K extends keyof DemoControlsState>(key: K, value: DemoControlsState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const resetDemo = useCallback(() => {
    setState(DEFAULT_STATE)
    setResetSignal((n) => n + 1)
  }, [])

  return (
    <DemoControlsContext.Provider value={{ ...state, setControl, resetSignal, resetDemo }}>
      {children}
    </DemoControlsContext.Provider>
  )
}

export function useDemoControls(): DemoControlsContextValue {
  const ctx = useContext(DemoControlsContext)
  if (!ctx) throw new Error("useDemoControls must be used within DemoControlsProvider")
  return ctx
}
