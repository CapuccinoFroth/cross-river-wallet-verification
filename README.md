# Cross River

A concept prototype for **compliance-enabled money movement** between on-chain assets and a Cross River balance. It demonstrates how WalletConnect / Reown AppKit orchestrates wallet interactions and compliance data handoffs while Cross River remains the final decision-maker.

> This is a demonstration only. No real funds move, balances are illustrative, and compliance outcomes are simulated with the built-in demo controls. **Wallet connection and ownership verification use live WalletConnect / Reown AppKit with SIWX.**

## Features

- **Two money-movement flows** in a tabbed interface:
  - **Universal Top-Up** — fund a Cross River balance from a supported digital asset.
  - **Payout to External Wallet** — withdraw Cross River to a verified beneficiary wallet.
- **Verification-first design** — every flow begins with live WalletConnect wallet-ownership verification (SIWX message signing) before any value moves.
- **Compliance on Flow panel** — makes the behind-the-scenes split of responsibilities between WalletConnect (connectivity, data relay, Travel Rule) and Cross River (KYC, screening, permissioning, final decision) explicit.
- **Demo controls** — simulate Cross River's compliance outcomes: approve/decline, enhanced review delay, Travel Rule requirements, and beneficiary mismatch holds.
- **Shared account state** — an illustrative balance and activity history that both flows read from and update.

## Setup

Wallet connectivity requires a Reown (WalletConnect) project ID. The rest of the demo stays interactive without it — only live wallet actions are disabled.

1. Create a project at [dashboard.reown.com](https://dashboard.reown.com).
2. Copy the Project ID.
3. Add it to your environment variables:

   ```
   NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here
   ```

## Tech stack

- Next.js (App Router) + React
- Reown AppKit (`@reown/appkit`) with the Wagmi adapter and `DefaultSIWX` for sign-in verification
- Wagmi + Viem + TanStack Query
- Tailwind CSS + shadcn/ui components

## Disclaimer

Cross River is not a real product. This project exists to illustrate a compliance-aware money-movement UX pattern and the division of responsibilities between a wallet-connectivity layer and a regulated financial institution.
