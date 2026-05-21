# AGENTS.md

## Cursor Cloud specific instructions

This is a GitHub profile README repository (the special `username/username` repo). It contains only a `README.md` file — there is no application code, no dependencies, no build system, and no services to run.

### Development workflow

- **Lint**: No lint tooling is configured. Optionally run `npx markdownlint-cli README.md` for Markdown style checks, but note the existing README has intentional stylistic choices (e.g., no top-level heading).
- **Tests**: No automated tests exist; visual verification is done on GitHub.
- **Build/Run**: Not applicable — the README is rendered by GitHub when visiting the profile page.

### Notes

- Any changes should be limited to `README.md` content updates.
- This repo has no dependencies, no `package.json`, and no build configuration.
This repository is a Vite + React + TypeScript single-page app for XCOM 2: War of the Chosen strategy recommendations with Phantom commander identity signing.

### Development workflow

- **Install**: Run `npm install` if `node_modules` is missing.
- **Build/type-check**: Run `npm run build`, which executes `tsc -b && vite build`.
- **Dev server**: Run `npm run dev` and open the local Vite URL.
- **Lint/tests**: No separate lint or automated test scripts are configured.

### Notes

- The app must remain readable and usable without a wallet connected.
- Optional Phantom Portal/social-login behavior is controlled by `VITE_PHANTOM_APP_ID` and `VITE_PHANTOM_REDIRECT_URL`; keep secrets out of committed files.
- Phantom integration should only request commander identity signing unless a future task explicitly changes that scope.
