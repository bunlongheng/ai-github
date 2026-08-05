# ai-github

Open-source contribution pipeline - track every PR submitted to public repos, with live status from the GitHub API.

## What it does

- Tracks GitHub PRs submitted to open-source projects
- Live status board (Draft / Open / Merged / Rejected) pulled from GitHub API every 5 min
- Acceptance rate displayed in footer
- Mirrors the visual style of the jobs board (gradient panels, status pills)

## Stack

Next.js 15 App Router - TypeScript - Tailwind CSS - GitHub REST API

## Setup

```bash
cd web
npm install
npm run dev       # http://localhost:3018
```

Optional - add a GitHub token to lift the 60 req/hr unauthenticated rate limit:

```bash
echo "GITHUB_TOKEN=ghp_..." >> web/.env.local
```

## Adding a PR

Edit `web/lib/prs.ts` and append to `PR_CATALOG`:

```ts
{
  number: 10465,
  repo: "owner/repo",
  title: "fix: description",
  issue: "#1234",
  submittedAt: "2026-08-05",
}
```

The board auto-picks up live status on next page load.

## Scripts

| Command | Action |
|---------|--------|
| `npm run dev` | Dev server on :3018 |
| `npm run build` | Production build |
| `npm test` | Unit tests (vitest) |
| `npm run lint` | Next.js ESLint |
