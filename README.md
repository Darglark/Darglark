# The Darglarking Yellow

A Vite + TypeScript single-page experience for an SCP-style hidden-lore hub. The current entry point
is `src/main.tsx`, which mounts the DOM-rendered Darglarking Yellow interface through
`renderDarglarkingHub`.

The repository also contains earlier React, Phantom, and Convex strategy panels. Those modules are still
type-checked and tested, but they are not mounted by the current `src/main.tsx` entry point.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open the printed local Vite URL in a browser. The Darglarking hub runs without backend services,
wallets, or API keys.

## Subsystem Map

| Area | Codepaths | Purpose and constraints |
| --- | --- | --- |
| Darglarking hub | `src/main.tsx`, `src/darglarkingHub.ts`, `src/styles.css` | Renders the active hidden-lore page, reveal pixel, invisible selection text, archived link, and PNG steganography controls. It uses direct DOM wiring rather than React. |
| Steganography codec | `src/steganography.ts`, `src/steganography.test.ts` | Embeds a UTF-8 message into PNG pixel data using a 32-bit length prefix and least-significant RGB bits. Alpha bytes are skipped. Decode throws when the length prefix or payload is incomplete. |
| Rails-Thorne guard | `src/RailsThorneGuardPanel.tsx`, `src/rbc999Telemetry.ts`, `src/rbc999Telemetry.test.ts` | React-only telemetry panel for the older strategy shell. The guard engages when `stressVelocity` exceeds `0.88`, emits reverse tether metadata, and routes the ringmaster entity into dummy testing. |
| Rouge Tile stats | `src/RougeTileStatsPanel.tsx`, `src/rougeTileStats.ts`, `src/rougeTileStats.test.ts` | In-memory stat display engine with dictionary-driven rows and achievement thresholds at `tiles_defended >= 7654` and `waves_cleared >= 42`. |
| Convex backend | `convex/schema.ts`, `convex/briefings.ts`, `convex/users.ts`, `convex/lib/auth.ts` | Optional backend for the older React panels. `commandBriefings` supports public list/create/complete/delete mutations; `users` stores WorkOS identities by `tokenIdentifier`. |
| Phantom identity | `src/App.tsx` | Optional older React wallet flow. It signs a commander profile with `solana.signMessage`; it does not build, sign, or send transactions. |

## Working With The Active Hub

The hub is intentionally client-only:

- File uploads are read with `URL.createObjectURL` and drawn into a local `<canvas>`.
- Encoded PNGs are exported with `canvas.toBlob`; no image data leaves the browser.
- Only `image/png` uploads are accepted so the least-significant-bit output remains lossless.
- The encode action verifies the result by immediately decoding the modified pixel buffer before
  exposing the download link.

Manual smoke checks:

1. Load the Vite dev URL and confirm the page title is `The Darglarking Yellow`.
2. Click the tiny calibration pixel under `Addendum 044-A` and confirm `Addendum 044-B` toggles.
3. Select the blank note text and confirm the suppressed yellow annotation can be visually revealed.
4. Upload a PNG, click `Embed into LSBs`, and confirm the status reports the decoded secret.
5. Try a non-PNG file and confirm the page shows a local validation error.

## Optional Convex And WorkOS Backend

Run Convex only when working on the older React strategy panels or backend functions:

```bash
npx convex dev
```

Copy the generated deployment URL into `.env`:

```bash
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

For WorkOS AuthKit roster sync, also set:

```bash
VITE_WORKOS_CLIENT_ID=client_your_client_id
VITE_WORKOS_REDIRECT_URI=http://localhost:5173/callback
```

Set server-side Convex secrets before deploying auth-backed functions:

```bash
npx convex env set WORKOS_CLIENT_ID client_your_client_id
npx convex env set WORKOS_API_KEY sk_your_api_key
```

Backend constraints:

- `briefings.create` trims titles and rejects empty titles.
- `briefings.list` returns the latest 8 rows by `createdAt` descending.
- `users.storeUser` requires an authenticated WorkOS identity and defaults new roles to `user`.
- `requireAdmin` only accepts stored users whose role is `admin`.

## Optional Phantom Portal / Social Providers

These settings only matter if `src/App.tsx` is mounted again and Phantom Portal support is needed:

```bash
VITE_PHANTOM_APP_ID=your-portal-app-id
VITE_PHANTOM_REDIRECT_URL=http://localhost:5173/auth/phantom/callback
```

If `VITE_PHANTOM_REDIRECT_URL` is omitted, the React flow uses:

```text
${window.location.origin}/auth/phantom/callback
```

Add the redirect URL to the Phantom Portal allowlist before testing Google or Apple sign-in.

## Verification

```bash
npm run test
npm run build
```

Use `npx convex dev` when changing files under `convex/`, and reserve `npx convex deploy` for production
deployment. The repository has no separate lint script.
