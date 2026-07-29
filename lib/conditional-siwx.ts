import { DefaultSIWX } from "@reown/appkit-siwx"
import type { SIWXSession } from "@reown/appkit-controllers"

type GetSessionsParams = Parameters<DefaultSIWX["getSessions"]>

// A synthetic, non-empty session used ONLY to tell AppKit's connect-time flow
// that the wallet is "already authenticated" so it never automatically opens
// the signature modal on connect or network change. It is never surfaced as a
// real ownership proof — a signature is only ever requested explicitly, via a
// flow's "Sign ownership proof" action (which is shown only when the demo
// control for wallet ownership verification is turned on).
const SUPPRESS_SESSION = [
  {
    data: { accountAddress: "0x0", chainId: "eip155:0" },
    message: "",
    signature: "",
  } as unknown as SIWXSession,
]

/**
 * SIWX that never triggers AppKit's automatic on-connect signature prompt.
 *
 * AppKit's `initializeIfEnabled` opens the signature modal on connect whenever
 * SIWX is configured and `getSessions` returns an empty array (it ignores
 * `getRequired()`). We therefore report a synthetic session from `getSessions`
 * whenever there is no real signed session, which suppresses that automatic
 * prompt. Explicit signatures — requested by a flow via
 * `SIWXUtil.requestSignMessage()` — do not depend on `getSessions`, so they
 * still work and create a real session.
 *
 * The app's verification hook reads `getRealSessions()` instead, so it only
 * ever sees genuine signed sessions and can accurately detect when the user
 * has completed an explicit ownership signature.
 */
export class ConditionalSIWX extends DefaultSIWX {
  /** Real signed sessions, bypassing the connect-time suppression. */
  getRealSessions(...args: GetSessionsParams): Promise<SIWXSession[]> {
    return super.getSessions(...args)
  }

  async getSessions(...args: GetSessionsParams): Promise<SIWXSession[]> {
    const real = await super.getSessions(...args)
    if (real.length > 0) return real
    return SUPPRESS_SESSION
  }

  // Not required: cancelling a signature should simply close the modal and let
  // the user retry, never force-disconnect the wallet.
  getRequired() {
    return false
  }
}
