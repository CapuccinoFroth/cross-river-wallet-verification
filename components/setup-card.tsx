import { KeyRound } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Shown when NEXT_PUBLIC_REOWN_PROJECT_ID is not set, instead of crashing.
export function SetupCard() {
  return (
    <Card className="border-dashed ring-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <KeyRound className="size-4" />
          </span>
          <CardTitle>Wallet connectivity needs setup</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
        <p>
          Add <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
            NEXT_PUBLIC_REOWN_PROJECT_ID
          </code>{" "}
          to enable wallet connectivity.
        </p>
        <ol className="ml-4 list-decimal space-y-1">
          <li>
            Create a project at{" "}
            <a
              href="https://dashboard.reown.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              dashboard.reown.com
            </a>
            .
          </li>
          <li>Copy the Project ID.</li>
          <li>
            Set it as{" "}
            <span className="font-mono text-foreground">NEXT_PUBLIC_REOWN_PROJECT_ID</span> in your
            environment variables.
          </li>
        </ol>
        <p className="text-xs">
          The rest of the demo remains interactive — only live wallet actions are disabled.
        </p>
      </CardContent>
    </Card>
  )
}
