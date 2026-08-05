# ai-github

> Automated open-source contribution pipeline - discover real PR opportunities, track every submission, and build engineering reputation through quality pull requests.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)

## What it does

- **Hourly discovery scan** - automatically finds unclaimed bug issues across 20+ active repos using the GitHub API, scores each opportunity by confidence (0-100%), and surfaces the best ones
- **Live PR board** - tracks every submitted PR with real-time status (Open / Merged / Draft / Rejected) pulled directly from the GitHub API
- **Opportunity dashboard** - sortable table with confidence scores, effort estimates, issue age, and "why this is a good bet" reasoning
- **Favorites** - star repos to always process them first in each scan cycle
- **1 PR per repo** - enforced in the discovery engine to build trust incrementally

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 App Router (server components) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS |
| Data | GitHub REST API v3 |
| Discovery | Node.js + `gh` CLI |
| Tests | Vitest |
| Hosting | Vercel |

## Setup

```bash
# 1. Clone
git clone https://github.com/bunlongheng/ai-github
cd ai-github/web

# 2. Install dependencies
npm install

# 3. (Optional) add a GitHub token to raise the API rate limit from 60 to 5,000 req/hr
echo "GITHUB_TOKEN=ghp_..." >> .env.local

# 4. Run the dev server
npm run dev        # http://localhost:3018
```

## Running the discovery scan

```bash
# From the repo root
node scripts/discover.mjs
```

The script scans all repos in `SEED_REPOS` plus live GitHub search results, checks each for:
1. Vitality: at least 2 merged PRs in the last 60 days
2. Open bug issues with no competing pull request
3. Confidence score >= 30

Results are written to `web/data/pipeline.json` (gitignored - runtime data).

**Schedule it hourly** with cron or any task scheduler:
```cron
13 * * * * cd /path/to/ai-github && node scripts/discover.mjs >> /tmp/discover.log 2>&1
```

## Adding a submitted PR

Edit `web/lib/prs.ts` and append to `PR_CATALOG`:

```ts
{
  number: 10465,        // actual PR number on GitHub
  repo: "owner/repo",  // e.g. "marimo-team/marimo"
  title: "fix: short description",
  issue: "#9624",
  submittedAt: "2026-08-05",
}
```

The board picks up live status on the next page load (cached for 5 minutes).

## Confidence scoring

Each opportunity is scored 0-100:

| Signal | Points |
|--------|--------|
| No competing PR exists | +40 |
| Repo vitality >= 8 merged PRs/60 days | +25 |
| Repo vitality >= 5 merged PRs/60 days | +18 |
| Issue age 30-180 days | +20 |
| Issue has maintainer comment | +15 |

Score >= 70 = high confidence. Score < 30 = filtered out.

## Scripts

| Command | Action |
|---------|--------|
| `npm run dev` | Dev server on :3018 |
| `npm run build` | Production build |
| `npm test` | Unit tests (vitest) |
| `npm run lint` | ESLint |
| `node scripts/discover.mjs` | Run opportunity scan |

## Project structure

```
ai-github/
- scripts/
  - discover.mjs       # hourly discovery engine
- web/
  - app/
    - discover/        # opportunity dashboard
    - prs/             # submitted PR board
    - api/
      - opportunity/   # PATCH: favorite / skip
      - scan/          # POST: trigger scan on-demand
  - lib/
    - prs.ts           # PR catalog + live GitHub fetch
  - data/              # gitignored runtime data (pipeline.json written by discover.mjs)
```

## License

MIT - see [LICENSE](LICENSE)
