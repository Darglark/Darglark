# Shadow Chamber Command

A Vite + React + TypeScript sandbox for XCOM 2: War of the Chosen strategy
recommendations and Darglarking Yellow hidden-lore experiments.

The current Vite entrypoint renders the Darglarking hub directly. The
Phantom/Convex commander shell remains in `src/App.tsx` for wallet-backed
strategy flows.

## Features

- Darglarking Yellow archive hub with hidden text, a pixel lore reveal, and
  a broken Wayback artifact link.
- Browser-only PNG steganography that embeds and verifies short secrets in
  RGB least significant bits.
- Phantom extension/injected provider is the default wallet path and does
  not require a Phantom Portal appId.
- Optional Phantom Portal/social login support is enabled when
  `VITE_PHANTOM_APP_ID` is set.
- Optional Convex + WorkOS AuthKit support syncs authenticated users into a
  protected `users` table.
- Commander profile signing uses `TextEncoder` and `solana.signMessage`.
  It never requests transactions or private keys.
- The strategy UI is readable and testable without a wallet.
- Wallet connect, disconnect, and signing flows use async `try/catch` and
  surface rejection/error messages in the UI.
- RBC-999/Rails-Thorne telemetry and Rouge Tile Defense helpers are covered
  by Vitest model tests.

## Source map

- `src/main.tsx`
  - Mounts `renderDarglarkingHub` into `#root`.
- `src/darglarkingHub.ts`
  - Builds the archive UI.
  - Handles PNG upload, stego encode, download, and hidden lore reveal.
- `src/steganography.ts`
  - Encodes a 32-bit byte-length prefix plus UTF-8 message bits.
  - Writes only to RGB channels and preserves alpha.
- `src/App.tsx`
  - React UI for tactical doctrines, Phantom signing, Convex briefings,
    Rails-Thorne, and Rouge panels.
- `src/rbc999Telemetry.ts` and `src/RailsThorneGuardPanel.tsx`
  - Deterministic telemetry models and canvas rendering for override and
    sandbox guard behavior.
- `src/rougeTileStats.ts` and `src/RougeTileStatsPanel.tsx`
  - Dictionary-backed stat rows and achievement-threshold reporting.
- `convex/schema.ts`, `convex/briefings.ts`, and `convex/users.ts`
  - Shared command briefings plus optional WorkOS-authenticated roster sync.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open the printed local Vite URL in a browser. The active Darglarking hub does
not require Phantom or Convex env vars.

Run `npx convex dev` only when exercising the optional Convex-backed strategy
shell.

## Darglarking Yellow hub workflow

The active entrypoint calls `renderDarglarkingHub(root)`. That function
replaces the root content with a static archive-style UI and attaches browser
event handlers.

1. Select a PNG in the "Client-side steganography tool" panel.
2. Enter a short secret code. The input is limited to 80 characters.
3. Click `Embed into LSBs`.
4. The encoder writes into the canvas.
5. The encoded pixels are decoded immediately as a verification check.
6. The `Download encoded PNG` link appears only after a successful export.

Constraints and common pitfalls:

- Encoding is local to the browser. The app does not upload the image or
  secret.
- PNG is required because lossy formats can rewrite least significant bits.
- Alpha channels are skipped, so transparent assets keep their opacity.
- Capacity is based on RGB channels minus the 32-bit length prefix.
- Oversized messages throw:
  `Secret message is too large for the selected image.`
- Decode failures throw `Encoded payload is incomplete.` when the pixel buffer
  cannot contain the advertised byte length.
- Re-encoding the same canvas compounds bit changes. Reload the source PNG if
  you need a clean baseline.

## Optional Convex live backend

Run the Convex development server and copy the deployment URL into `.env`:

```bash
npx convex dev
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

The app includes a Convex schema and CRUD functions for `commandBriefings`.
Once `VITE_CONVEX_URL` is set, the command briefing panel lists, creates,
completes, and deletes live shared strategy notes.

Use `npx convex dev` for development. Reserve `npx convex deploy` for
production deployment.

Backend constraints:

- `briefings.list` returns the newest 8 command briefings via the
  `by_created_at` index.
- `briefings.create` trims titles and rejects empty titles.
- `briefings.setCompleted` and `briefings.remove` operate on Convex
  `commandBriefings` IDs.
- `users.storeUser` requires a WorkOS identity and upserts by
  `tokenIdentifier`.

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

Add the redirect URL to the Phantom Portal allowlist before testing Google or
Apple sign-in.

## Optional Convex AuthKit roster

Run `npx convex dev` to create the Convex deployment and generate
`VITE_CONVEX_URL`. The `convex/` backend defines:

- `users` table with `tokenIdentifier`, `email`, and role indexes.
- `users.storeUser` to upsert the current authenticated identity.
- `getCurrentUser`, `getCurrentUserOrNull`, and `requireAdmin` helpers for
  protected functions.

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
npm test
npm run build
npm run dev
npx convex dev
```

Manual checks:

1. Load the current app and confirm the Darglarking Yellow hub renders.
2. Click the Addendum 044-A pixel trigger and confirm hidden lore appears.
3. Confirm the pixel trigger updates `aria-expanded`.
4. Select the blank note text in "Hidden layers".
5. Confirm the suppressed note can be revealed visually.
6. Upload a PNG and click `Embed into LSBs`.
7. Confirm the status reports the decoded secret before downloading.
8. Try a non-PNG upload and confirm the lossless-PNG error.
9. If `src/App.tsx` is wired as the entrypoint, load with no wallet connected.
10. Confirm all XCOM strategy panels render in the strategy shell.
11. Click tactical doctrine and SCP protocol cards.
12. Confirm selected strategy guidance updates.
13. Click `Sign Commander Identity` before connecting.
14. Confirm the UI shows a helpful connection error.
15. Without `VITE_CONVEX_URL`, confirm the Convex quickstart panel appears.
16. With `VITE_CONVEX_URL`, add, complete, and delete a shared briefing.
17. With Phantom extension installed, click `Connect Phantom Extension`.
18. Approve the connection, then click `Sign Commander Identity`.
19. Reject a signature request once and confirm rejection is shown gracefully.
20. With Convex and WorkOS env vars set, sign in.
21. Confirm the Convex roster panel reports the authenticated user is linked.

## Phantom safety notes

This app only signs a message to establish a commander identity/profile. It
does not build, sign, or send Solana transactions, and it does not handle
private keys.

The implementation is devnet-friendly because it performs no chain writes and
never touches mainnet funds.
