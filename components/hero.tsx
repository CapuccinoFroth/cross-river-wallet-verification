import {
  ArrowRight,
  Smartphone,
  Link2,
  ShieldCheck,
  Boxes,
  Info,
  UserCheck,
  ScanSearch,
  FileText,
  Landmark,
  Building2,
  User,
  ChevronRight,
} from "lucide-react"

const capabilities = [
  { icon: ShieldCheck, label: "Wallet ownership verification" },
  { icon: UserCheck, label: "Beneficiary validation handoff" },
  { icon: ScanSearch, label: "Transaction screening handoff" },
  { icon: FileText, label: "Travel Rule data relay" },
]

function ArchNode({
  icon: Icon,
  title,
  tone,
}: {
  icon: typeof Smartphone
  title: string
  tone: "app" | "wc" | "crossriver" | "chain"
}) {
  const tones: Record<string, string> = {
    app: "bg-card text-foreground ring-foreground/10",
    wc: "bg-primary/10 text-primary ring-primary/20",
    crossriver: "bg-brand-navy text-background ring-brand-navy/30",
    chain: "bg-muted text-muted-foreground ring-foreground/10",
  }
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ring-1 ${tones[tone]}`}
    >
      <Icon className="size-4 shrink-0" />
      <span className="text-pretty">{title}</span>
    </div>
  )
}

export function Hero() {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-balance text-foreground md:text-4xl">
          Move between on-chain assets and Cross River with compliance built into the flow.
        </h1>
        <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          Connect and verify an external wallet, fund a Cross River balance from supported digital
          assets, or withdraw to a verified beneficiary wallet. WalletConnect orchestrates wallet
          interactions and compliance data handoffs while Cross River remains the final decision-maker.
        </p>
      </div>

      {/* Cross-cutting architecture banner */}
      <div className="rounded-2xl border border-border bg-surface-blue/60 p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          <ArchNode icon={Smartphone} title="Fintech App" tone="app" />
          <Arrow />
          <div className="flex-1 rounded-xl bg-primary/5 p-3 ring-1 ring-primary/20">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Link2 className="size-4" />
              </span>
              <span className="text-sm font-semibold text-primary">
                WalletConnect connectivity &amp; compliance orchestration
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {capabilities.map((c) => (
                <div
                  key={c.label}
                  className="flex items-center gap-2 rounded-lg bg-card px-2.5 py-2 text-xs font-medium text-foreground ring-1 ring-primary/10"
                >
                  <c.icon className="size-3.5 shrink-0 text-primary" />
                  <span className="text-pretty">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
          <Arrow />
          <ArchNode icon={ShieldCheck} title="Cross River Compliance" tone="crossriver" />
          <Arrow />
          <ArchNode icon={Boxes} title="Blockchain / Cross River Ledger" tone="chain" />
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" />
          Cross River retains final permissioning, enforcement, and all compliance determinations.
        </p>
      </div>

      {/* Viewer-perspective breadcrumb — clarifies who sees the flows below */}
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-primary/25 bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
        <nav aria-label="Distribution hierarchy" className="min-w-0">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
            <BreadcrumbStep icon={Landmark} label="Cross River Bank" sub="Client / bank" />
            <BreadcrumbSep />
            <BreadcrumbStep icon={Building2} label="Fintech partner" sub="CRB's client" />
            <BreadcrumbSep />
            <BreadcrumbStep icon={User} label="End user" sub="You are here" active />
          </ol>
        </nav>
        <p className="max-w-md text-pretty text-xs leading-relaxed text-muted-foreground">
          The <span className="font-medium text-foreground">Universal Top-Up</span> and{" "}
          <span className="font-medium text-foreground">Payout to Wallet</span>{" "}
          flows below are the end user&apos;s view — the WalletConnect Headless SDK is embedded in
          the fintech&apos;s app,
          so neither Cross River nor the fintech builds the wallet-connectivity UI.
        </p>
      </div>
    </section>
  )
}

function BreadcrumbStep({
  icon: Icon,
  label,
  sub,
  active = false,
}: {
  icon: typeof Smartphone
  label: string
  sub: string
  active?: boolean
}) {
  return (
    <li
      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ring-1 ${
        active
          ? "bg-primary/10 ring-primary/30"
          : "bg-muted/60 ring-foreground/5"
      }`}
    >
      <Icon className={`size-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
      <span className="flex flex-col leading-tight">
        <span className={`text-sm font-medium ${active ? "text-primary" : "text-foreground"}`}>
          {label}
        </span>
        <span className="text-[11px] text-muted-foreground">{sub}</span>
      </span>
    </li>
  )
}

function BreadcrumbSep() {
  return (
    <li aria-hidden="true">
      <ChevronRight className="size-4 text-muted-foreground/60" />
    </li>
  )
}

function Arrow() {
  return (
    <div className="flex items-center justify-center lg:px-1">
      <ArrowRight className="size-4 rotate-90 text-muted-foreground lg:rotate-0" />
    </div>
  )
}
