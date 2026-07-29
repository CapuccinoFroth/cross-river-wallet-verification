"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Loader2, CircleAlert, Pause } from "lucide-react"
import { cn } from "@/lib/utils"

export type Owner = "walletconnect" | "crossriver" | "crossriver-wc" | "ledger"

export interface TimelineStage {
  label: string
  owner: Owner
}

const ownerStyles: Record<Owner, { dot: string; ring: string; label: string }> = {
  walletconnect: {
    dot: "bg-primary text-primary-foreground",
    ring: "ring-primary/30",
    label: "WalletConnect",
  },
  crossriver: {
    dot: "bg-brand-navy text-background",
    ring: "ring-brand-navy/25",
    label: "CrossRiver",
  },
  "crossriver-wc": {
    dot: "bg-brand-navy text-background",
    ring: "ring-primary/30",
    label: "CrossRiver & WalletConnect",
  },
  ledger: {
    dot: "bg-muted-foreground text-background",
    ring: "ring-muted-foreground/20",
    label: "Ledger",
  },
}

interface FlowTimelineProps {
  stages: TimelineStage[]
  /** Whether the animation is running. */
  active: boolean
  /** When true, the flow holds on the current step until unpaused. */
  paused?: boolean
  /** ms per stage */
  stepDuration?: number
  /** If set, the flow halts at this index and marks it as an error/stop. */
  stopAtIndex?: number
  stopLabel?: string
  onComplete?: () => void
  onStopped?: () => void
}

export function FlowTimeline({
  stages,
  active,
  paused = false,
  stepDuration = 1000,
  stopAtIndex,
  stopLabel,
  onComplete,
  onStopped,
}: FlowTimelineProps) {
  const [current, setCurrent] = useState(-1)
  const [stopped, setStopped] = useState(false)
  const completedRef = useRef(false)

  // Reset progress whenever the flow (re)activates.
  useEffect(() => {
    setCurrent(-1)
    setStopped(false)
    completedRef.current = false
  }, [active])

  // Step forward one stage at a time. Pausing simply skips scheduling the
  // next tick, so progress is retained and resumes when unpaused.
  useEffect(() => {
    if (!active || paused || stopped) return
    if (current >= stages.length) return

    const delay = current === -1 ? stepDuration * 0.5 : stepDuration
    const timer = setTimeout(() => {
      const next = current + 1

      // Halt at the stop index to represent a blocked decision.
      if (stopAtIndex != null && next === stopAtIndex) {
        setCurrent(next)
        setStopped(true)
        onStopped?.()
        return
      }

      setCurrent(next)
    }, delay)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, paused, stopped, current, stages.length, stepDuration, stopAtIndex])

  // Fire completion once the flow runs past the final stage.
  useEffect(() => {
    if (active && !stopped && current >= stages.length && !completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stopped, current, stages.length])

  return (
    <ol className="flex flex-col gap-3" aria-live="polite">
      {stages.map((stage, i) => {
        const isDone = i < current
        const isActive = i === current && !stopped
        const isPaused = isActive && paused
        const isStop = i === current && stopped
        const style = ownerStyles[stage.owner]

        return (
          <li key={stage.label} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ring-4 transition-colors",
                isDone && `${style.dot} ${style.ring}`,
                isActive && `${style.dot} ${style.ring}`,
                isActive && !isPaused && "animate-pulse",
                isStop && "bg-destructive text-background ring-destructive/20",
                !isDone && !isActive && !isStop && "bg-muted text-muted-foreground ring-transparent",
              )}
            >
              {isStop ? (
                <CircleAlert className="size-3.5" />
              ) : isDone ? (
                <Check className="size-3.5" />
              ) : isPaused ? (
                <Pause className="size-3.5" />
              ) : isActive ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
            </span>
            <div className="flex flex-col pt-0.5">
              <span
                className={cn(
                  "text-sm leading-snug",
                  isDone || isActive ? "font-medium text-foreground" : "text-muted-foreground",
                  isStop && "font-medium text-destructive",
                )}
              >
                {isStop && stopLabel ? stopLabel : stage.label}
                {isPaused ? <span className="ml-2 text-xs text-muted-foreground">(paused)</span> : null}
              </span>
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground/80 uppercase">
                {style.label}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
