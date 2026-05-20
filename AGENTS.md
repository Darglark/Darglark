# AGENTS.md

## Cursor Cloud specific instructions

This is a GitHub profile README repository (the special `username/username` repo). It contains only a `README.md` file — there is no application code, no dependencies, no build system, and no services to run.

### Development workflow

- **Lint**: `markdownlint README.md` (installed globally via `npm install -g markdownlint-cli`)
- **Tests**: No automated tests exist; visual verification is done on GitHub.
- **Build/Run**: Not applicable — the README is rendered by GitHub when visiting the profile page.

### Notes

- The existing README has pre-existing markdownlint warnings (MD041 missing top-level heading, MD013 line-length). These are stylistic choices by the repo owner.
- Any changes should be limited to `README.md` content updates.
