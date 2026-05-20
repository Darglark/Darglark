# Shadow Chamber Command

A Vite + React + TypeScript single-page app for XCOM 2: War of the Chosen strategy recommendations.
It integrates Phantom Connect for Solana-only commander identity signing.

## Features

- Phantom extension/injected provider is the default path and does not require a Phantom Portal appId.
- Optional Phantom Portal/social login support is enabled when `VITE_PHANTOM_APP_ID` is set.
- Optional Convex + WorkOS AuthKit support syncs authenticated users into a protected `users` table.
- Commander profile signing uses `TextEncoder` and `solana.signMessage`; it never requests transactions or private keys.
- The strategy UI is fully readable and testable without a wallet.
- Wallet connect, disconnect, and signing flows use async `try/catch` and surface rejection/error messages in the UI.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open the printed local Vite URL in a browser. Without env vars, the app runs in extension-only mode.

## Optional Phantom Portal / social providers

Set these only when you have a Phantom Portal app:

```bash
VITE_PHANTOM_APP_ID=your-portal-app-id
VITE_PHANTOM_REDIRECT_URL=http://localhost:5173/auth/phantom/callback
```

If `VITE_PHANTOM_REDIRECT_URL` is omitted, the app uses:

```text
${window.location.origin}/auth/phantom/callback
```

Add the redirect URL to the Phantom Portal allowlist before testing Google or Apple sign-in.

## Optional Convex AuthKit roster

Run `npx convex dev` to create the Convex deployment and generate `VITE_CONVEX_URL`. The `convex/` backend defines:

- `users` table with `tokenIdentifier`, `email`, and role indexes.
- `users.storeUser` to upsert the current authenticated identity.
- `getCurrentUser`, `getCurrentUserOrNull`, and `requireAdmin` helpers for protected functions.

Set these values in `.env` after WorkOS AuthKit is configured:

```bash
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_WORKOS_CLIENT_ID=client_your_client_id
VITE_WORKOS_REDIRECT_URI=http://localhost:5173/callback
```

Set the server-side Convex env vars before deploying auth:

```bash
npx convex env set WORKOS_CLIENT_ID client_your_client_id
npx convex env set WORKOS_API_KEY sk_your_api_key
```

## Verification commands

```bash
npx convex codegen --typecheck disable
npm run build
npm run dev
```

Manual checks:

1. Load the app with no wallet connected and confirm all XCOM strategy panels render.
2. Click tactical doctrine cards and confirm the selected card updates.
3. Click `Sign Commander Identity` before connecting and confirm the UI shows a helpful error.
4. With Phantom extension installed, click `Connect Phantom Extension`, approve the connection, then click `Sign Commander Identity`.
5. Reject a signature request once and confirm the rejection is shown gracefully.
6. With Convex and WorkOS env vars set, sign in and confirm the Convex roster panel reports that the authenticated user is linked.

## Phantom safety notes

This app only signs a message to establish a commander identity/profile. It does not build, sign, or send Solana transactions, and it does not handle private keys. The implementation is devnet-friendly because it performs no chain writes and never touches mainnet funds.
