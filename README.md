# The Darglarking Yellow

A Vite + React + TypeScript project whose current browser entrypoint
renders a vanilla DOM meta-narrative hub for The Darglarking Yellow.
The mounted runtime is `src/main.tsx` -> `src/darglarkingHub.ts`;
the older React XCOM/Phantom command UI still exists in `src/App.tsx`,
but `src/main.tsx` does not mount it today.

## Current Runtime

- `src/darglarkingHub.ts` replaces `#root` with the Darglarking dossier,
  hidden transcript, broken archive link, and client-side PNG
  steganography tool.
- `src/steganography.ts` embeds a UTF-8 message into the least
  significant bits of RGB channels only. Alpha values are preserved,
  and a 32-bit payload length prefix is decoded before reading message
  bytes.
- Encoding runs locally in the browser: upload a PNG, enter a short
  secret, click `Embed into LSBs`, and download the generated lossless
  PNG.
- The hub intentionally uses small hidden interactions: a one-pixel
  reveal button, selectable blank text, and an archival link that opens
  outside the app.

## Supporting Modules

- `src/rbc999Telemetry.ts` models Rails-Thorne guard states, Node 044
  identity checks, fractal samples, and hub movement physics. It is
  covered by `src/rbc999Telemetry.test.ts`.
- `src/rougeTileStats.ts` formats Rouge Tile Defense stats and
  achievement thresholds. It is covered by `src/rougeTileStats.test.ts`.
- `generate_volatility_paradox.py` builds a 32-bar MIDI file at
  `assets/volatility_paradox.mid` when run directly.
- `src/App.tsx`, `src/ConvexBriefings.tsx`, `src/ConvexAuthProvider.tsx`,
  and `convex/` contain the optional XCOM/Phantom/Convex command app
  modules. They are not part of the currently mounted page unless
  `src/main.tsx` is changed to render them.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open the printed local Vite URL in a browser. No environment variables
are required for the current Darglarking hub.

## Optional Command App Environment

These variables are only used by the optional React command app modules.
Set them if you intentionally remount `src/App.tsx` and want to test
Phantom Portal, Convex briefings, or WorkOS AuthKit roster sync.

### Convex live backend

Run the Convex development server and copy the generated deployment URL into `.env`:

```bash
npx convex dev
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

The app includes a Convex schema and CRUD functions for
`commandBriefings`. Once `VITE_CONVEX_URL` is set and the React command
app is mounted, the command briefing panel lists, creates, completes,
and deletes live shared strategy notes. Use `npx convex dev` for
development; reserve `npx convex deploy` for production deployment.

### Phantom Portal / social providers

Set these only when you have a Phantom Portal app:

```bash
VITE_PHANTOM_APP_ID=your-portal-app-id
VITE_PHANTOM_REDIRECT_URL=http://localhost:5173/auth/phantom/callback
```

If `VITE_PHANTOM_REDIRECT_URL` is omitted, the app uses:

```text
${window.location.origin}/auth/phantom/callback
```

Add the redirect URL to the Phantom Portal allowlist before testing
Google or Apple sign-in.

### Convex AuthKit roster

Run `npx convex dev` to create the Convex deployment and generate
`VITE_CONVEX_URL`. The `convex/` backend defines:

- `users` table with `tokenIdentifier`, `email`, and role indexes.
- `users.storeUser` to upsert the current authenticated identity.
- `getCurrentUser`, `getCurrentUserOrNull`, and `requireAdmin` helpers
  for protected functions.

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
npm test
npm run build
npm run dev
```

Manual checks:

1. Load the Vite URL and confirm the Darglarking dossier renders without env vars.
2. Click the one-pixel trigger after Addendum 044-A and confirm Addendum 044-B appears.
3. Select the blank note in the Hidden layers panel and confirm
   suppressed text is visually revealable.
4. Try a non-PNG upload and confirm the steganography status asks for a
   lossless PNG.
5. Upload a PNG, click `Embed into LSBs`, and confirm the status shows
   the decoded secret plus a download link.
6. If you remount `src/App.tsx`, repeat the Phantom, Convex, and WorkOS
   checks for the optional command app modules.

## Phantom safety notes

The optional React command app only signs a message to establish a
commander identity/profile. It does not build, sign, or send Solana
transactions, and it does not handle private keys. The implementation is
devnet-friendly because it performs no chain writes and never touches
mainnet funds.
