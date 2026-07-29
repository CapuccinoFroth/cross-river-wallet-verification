"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from "react"
import { INITIAL_CROSSRIVERUSD_BALANCE } from "@/lib/demo"

export type ActivityKind = "topup" | "payout"
export type ActivityStatus = "completed" | "blocked" | "review"

export interface ActivityItem {
  id: string
  kind: ActivityKind
  status: ActivityStatus
  amount: number
  detail: string
  network: string
  at: number
}

interface AccountContextValue {
  balance: number
  history: ActivityItem[]
  credit: (amount: number, item: Omit<ActivityItem, "amount" | "at" | "kind"> & { kind: "topup" }) => void
  debit: (amount: number, item: Omit<ActivityItem, "amount" | "at" | "kind"> & { kind: "payout" }) => void
  logOnly: (item: Omit<ActivityItem, "at">) => void
  reset: () => void
  /** True while a flow is in the "Compliance review" step — hands responsibility to CRB. */
  complianceActive: boolean
  setComplianceActive: (active: boolean) => void
}

const AccountContext = createContext<AccountContextValue | null>(null)

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(INITIAL_CROSSRIVERUSD_BALANCE)
  const [history, setHistory] = useState<ActivityItem[]>([])
  const [complianceActive, setComplianceActive] = useState(false)

  const credit: AccountContextValue["credit"] = useCallback((amount, item) => {
    setBalance((b) => b + amount)
    setHistory((h) => [{ ...item, amount, at: Date.now() }, ...h].slice(0, 8))
  }, [])

  const debit: AccountContextValue["debit"] = useCallback((amount, item) => {
    setBalance((b) => Math.max(0, b - amount))
    setHistory((h) => [{ ...item, amount, at: Date.now() }, ...h].slice(0, 8))
  }, [])

  const logOnly: AccountContextValue["logOnly"] = useCallback((item) => {
    setHistory((h) => [{ ...item, at: Date.now() }, ...h].slice(0, 8))
  }, [])

  const reset = useCallback(() => {
    setBalance(INITIAL_CROSSRIVERUSD_BALANCE)
    setHistory([])
    setComplianceActive(false)
  }, [])

  const value = useMemo(
    () => ({ balance, history, credit, debit, logOnly, reset, complianceActive, setComplianceActive }),
    [balance, history, credit, debit, logOnly, reset, complianceActive],
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error("useAccount must be used within AccountProvider")
  return ctx
}
