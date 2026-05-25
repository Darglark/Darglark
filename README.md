# Shadow Chamber Command

A Vite + React + TypeScript single-page app for XCOM 2: War of the Chosen strategy recommendations.
It integrates Phantom Connect for Solana-only commander identity signing.

## Features

- Phantom extension/injected provider is the default path and does not require a Phantom Portal appId.
- Optional Phantom Portal/social login support is enabled when `VITE_PHANTOM_APP_ID` is set.
- Optional Convex + WorkOS AuthKit support syncs authenticated users into an authenticated `users` table.
- Commander profile signing uses `TextEncoder` and `solana.signMessage`; it never requests transactions or private keys.
- The strategy UI is fully readable and testable without a wallet.
- Wallet connect, disconnect, and signing flows use async `try/catch` and surface rejection/error messages in the UI.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open the printed local Vite URL in a browser. Without Phantom env vars, the app runs in extension-only mode.
Without `VITE_CONVEX_URL`, the shared briefing panel shows setup instructions instead of live data.
Run `npx convex dev` in a second terminal only when you want the live Convex backend.

## Runtime modes

The app is intentionally useful without any optional services. Enable each integration by setting only the env vars
for the mode you need:

| Mode | Required env vars | What changes |
| --- | --- | --- |
| Offline field manual | None | XCOM doctrine, SCP protocol, and squad guidance render without a wallet or backend. |
| Phantom extension identity | None | `src/App.tsx` connects the injected Phantom provider and signs a read-only commander profile message. |
| Phantom Portal / social sign-in | `VITE_PHANTOM_APP_ID`; optional `VITE_PHANTOM_REDIRECT_URL` | `src/main.tsx` adds Google and Apple providers to Phantom, still restricted to Solana addresses. |
| Convex live briefings | `VITE_CONVEX_URL` | `src/ConvexBriefings.tsx` reads and writes shared briefing notes through `convex/briefings.ts`. |
| Convex + WorkOS roster | `VITE_CONVEX_URL`, `VITE_WORKOS_CLIENT_ID`, `VITE_WORKOS_REDIRECT_URI`, Convex `WORKOS_CLIENT_ID` | `src/ConvexAuthProvider.tsx` enables AuthKit and `src/AuthStatus.tsx` syncs signed-in users to `convex/users.ts`. |

Do not commit real IDs, redirect URLs for private deployments, or server-side secrets. Keep local values in `.env`
and Convex environment variables.

## Codepath map

- `src/main.tsx` builds the Phantom SDK config from `VITE_PHANTOM_APP_ID` and wraps the app in Convex providers
  when a Convex URL is present.
- `src/App.tsx` owns the wallet connection state, tactical doctrine state, and commander identity signing message.
- `src/ConvexBriefings.tsx` renders the shared briefing board and calls public Convex CRUD functions.
- `src/ConvexAuthProvider.tsx` chooses between no backend, unauthenticated Convex, and Convex with WorkOS AuthKit.
- `src/AuthStatus.tsx` handles sign-in/sign-out UI and calls `users.storeUser` after AuthKit returns a user.
- `convex/schema.ts`, `convex/briefings.ts`, `convex/users.ts`, and `convex/lib/auth.ts` define backend data,
  public mutations, and reusable auth helpers.

## Optional Convex live backend

Run the Convex development server and copy the deployment URL into `.env`:

```bash
npx convex dev
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

The app includes a Convex schema and public CRUD functions for `commandBriefings`:

- `briefings.list` returns the latest 8 briefings by `createdAt`, newest first.
- `briefings.create` trims the submitted title, rejects an empty title, and stores the current doctrine/protocol.
- `briefings.setCompleted` toggles completion state.
- `briefings.remove` deletes a briefing.

Use `npx convex dev` for development; reserve `npx convex deploy` for production deployment. The current briefing
functions are public so the live board is easy to demo. Add auth checks before storing sensitive strategy notes or
user-specific data.

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

Run `npx convex dev` to create the Convex deployment and generate `VITE_CONVEX_URL`. Then configure WorkOS AuthKit
for the same redirect URI used by the Vite app:

```bash
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_WORKOS_CLIENT_ID=client_your_client_id
VITE_WORKOS_REDIRECT_URI=http://localhost:5173/callback
```

Set the Convex server-side auth config value before deploying auth:

```bash
npx convex env set WORKOS_CLIENT_ID client_your_client_id
```

The current backend uses `WORKOS_CLIENT_ID` in `convex/auth.config.ts` to validate WorkOS JWTs. It does not read a
WorkOS API key; only add one later if backend code starts calling the WorkOS API directly.

The `convex/` backend defines:

- `users` table with `tokenIdentifier`, `email`, `name`, `pictureUrl`, and role indexes.
- `users.storeUser` to upsert the current authenticated identity and default new users to the `user` role.
- `users.current` and `users.requireCurrentUser` queries for checking the active identity.
- `getCurrentUser`, `getCurrentUserOrNull`, and `requireAdmin` helpers for future protected functions.

When only `VITE_CONVEX_URL` is set, Convex briefings work without AuthKit and the roster panel stays hidden. When
`VITE_WORKOS_CLIENT_ID` is also set, AuthKit wraps Convex and `AuthStatus` calls `users.storeUser` after sign-in.

## Troubleshooting

```bash
# Refresh generated Convex API/types after changing convex/ files.
npx convex codegen --typecheck disable
```

- **Briefing panel shows setup instructions**: `VITE_CONVEX_URL` is missing or blank in `.env`.
- **Roster panel does not render**: `VITE_WORKOS_CLIENT_ID` is missing, or Convex is not configured.
- **WorkOS sign-in loops or fails after redirect**: confirm `VITE_WORKOS_REDIRECT_URI` exactly matches the WorkOS
  allowed redirect URI.
- **Authenticated user is not linked**: run `npx convex env get WORKOS_CLIENT_ID` and confirm the Convex deployment
  has the same client ID as the Vite app.
- **Phantom Portal button is hidden**: `VITE_PHANTOM_APP_ID` is unset, so the app is intentionally in extension-only
  mode.
- **Signature button reports no account**: connect a Solana account first; signing uses `solana.signMessage` only.

If generated Convex files are stale, restart `npx convex dev` and re-run codegen before starting Vite.

## Verification commands

```bash
npx convex codegen --typecheck disable
npm run build
npm run dev
npx convex dev
```

Manual checks:

1. Load the app with no wallet connected and confirm all XCOM strategy panels render.
2. Click tactical doctrine cards and confirm the selected card updates.
3. Click `Sign Commander Identity` before connecting and confirm the UI shows a helpful error.
4. Without `VITE_CONVEX_URL`, confirm the Convex quickstart panel shows setup instructions.
5. With `VITE_CONVEX_URL` set, add, complete, and delete a shared command briefing.
6. With Phantom extension installed, click `Connect Phantom Extension`, approve the connection, then click `Sign Commander Identity`.
7. Reject a signature request once and confirm the rejection is shown gracefully.
8. With Convex and WorkOS env vars set, sign in and confirm the Convex roster panel reports that the authenticated user is linked.

## Phantom safety notes

This app only signs a message to establish a commander identity/profile. It does not build, sign, or send Solana transactions, and it does not handle private keys. The implementation is devnet-friendly because it performs no chain writes and never touches mainnet funds.
