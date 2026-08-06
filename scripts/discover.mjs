#!/usr/bin/env node
// Hourly PR opportunity discovery - reads/writes web/data/pipeline.json

import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STATE_FILE = join(ROOT, "web/data/pipeline.json");

const SEED_REPOS = [
  // Python / AI tooling
  "marimo-team/marimo",
  "gradio-app/gradio",
  "simonw/datasette",
  "BerriAI/litellm",
  "instructor-ai/instructor",
  "anthropics/anthropic-sdk-python",
  "openai/openai-python",
  "encode/httpx",
  "pallets/click",
  "tqdm/tqdm",
  "psf/black",
  "astral-sh/ruff",
  "pydantic/pydantic",
  "tiangolo/fastapi",
  "simonw/sqlite-utils",
  "httpie/cli",
  // Go / CLI
  "charmbracelet/bubbletea",
  "charmbracelet/lipgloss",
  "charmbracelet/glow",
  "cli/cli",
  // Laravel / PHP ecosystem
  "laravel/framework",
  "laravel/pint",
  "laravel/breeze",
  "spatie/laravel-permission",
  "spatie/laravel-medialibrary",
  "spatie/laravel-activitylog",
  "livewire/livewire",
  "barryvdh/laravel-debugbar",
  // React / Next.js ecosystem
  "vercel/next.js",
  "shadcn-ui/ui",
  "trpc/trpc",
  "pmndrs/zustand",
  "TanStack/query",
  "radix-ui/primitives",
  "emotion-js/emotion",
  "recharts/recharts",
  // Python - data / ML
  "pytest-dev/pytest",
  "python-poetry/poetry",
  "sqlalchemy/sqlalchemy",
  "celery/celery",
  "huggingface/huggingface_hub",
  "langchain-ai/langchain",
  "explosion/spaCy",
  "ml-explore/mlx",
  "pytorch/pytorch",
  "scikit-learn/scikit-learn",
  // Go - web / infra
  "gofiber/fiber",
  "gin-gonic/gin",
  "go-chi/chi",
  "spf13/cobra",
  "spf13/viper",
  "gorilla/mux",
  "urfave/cli",
  // Rust
  "tokio-rs/tokio",
  "serde-rs/serde",
  "actix/actix-web",
  "clap-rs/clap",
  // JavaScript / TypeScript
  "vitejs/vite",
  "sveltejs/svelte",
  "preactjs/preact",
  "formium/formik",
  "react-hook-form/react-hook-form",
  "colinhacks/zod",
  "biomejs/biome",
  "nicolo-ribaudo/jest",
  "jestjs/jest",
  // Ruby / Rails
  "rails/rails",
  "rubocop/rubocop",
  "heartcombo/devise",
  // DevTools / infra
  "nicolo-ribaudo/babel",
  "babel/babel",
  "evanw/esbuild",
  "rollup/rollup",
  "parcel-bundler/parcel",
];

// Cambodian developer community radar
// Public signal: GitHub profile location or org description mentions Cambodia / Phnom Penh
const CAMBODIA_DEVS = [
  { login: "seanghay",    reason: "location: Cambodia, 394 followers, builds Khmer NLP / image gen tools" },
  { login: "DJ-Raven",    reason: "location: Cambodia, 1203 followers, Java Swing UI libraries" },
  { login: "Chensokheng", reason: "location: Cambodia, 976 followers, developer + YouTuber" },
  { login: "invisal",     reason: "location: Cambodia, 361 followers, builds developer tools" },
  { login: "socheatsok78",reason: "location: Cambodia, 315 followers, FOSS / infrastructure" },
];

function gh(args) {
  try {
    const out = execSync(`gh ${args}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 15000,
    });
    return JSON.parse(out.trim());
  } catch {
    return null;
  }
}

function ghRaw(args) {
  try {
    return execSync(`gh ${args}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 10000,
    }).trim();
  } catch {
    return "";
  }
}

function readState() {
  if (!existsSync(STATE_FILE)) {
    return {
      last_scan: "",
      favorites: ["marimo-team/marimo"],
      repos_checked: {},
      submitted_prs: [],
      opportunities: [],
    };
  }
  return JSON.parse(readFileSync(STATE_FILE, "utf8"));
}

function writeState(state) {
  mkdirSync(join(ROOT, "web/data"), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function ageDays(iso) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

// Security keywords - maintainers merge these fastest, so we prioritize them
const SECURITY_RE =
  /\b(inject|injection|traversal|ssrf|xss|csrf|sanitiz|escape|redos|deserializ|pickle|unsafe|arbitrary|command exec|shell|secret leak|token leak|auth bypass|overflow|symlink|path escape|hardcoded|vulnerab)\b/i;

function isSecurity({ title, labels }) {
  if ((labels || []).some((l) => /security|vuln|cve/i.test(l))) return true;
  return SECURITY_RE.test(title || "");
}

function scoreOpportunity({ age, vitality, hasComment, noCompetingPR, security }) {
  let score = 0;
  if (noCompetingPR) score += 40;
  if (vitality >= 8) score += 25;
  else if (vitality >= 5) score += 18;
  else if (vitality >= 3) score += 12;
  else if (vitality >= 1) score += 5;
  if (age >= 30 && age <= 180) score += 20;
  else if (age > 180 && age <= 365) score += 10;
  if (hasComment) score += 15;
  // Security issues get merged faster and reviewers let them in more readily
  if (security) score += 20;
  return Math.min(score, 100);
}

function detectType(title) {
  const t = title.toLowerCase();
  if (SECURITY_RE.test(t)) return "security";
  if (/\btest|spec|coverage\b/.test(t)) return "tests";
  if (/\bdoc|readme|example\b/.test(t)) return "docs";
  if (/\bperf|speed|slow|optim|latency\b/.test(t)) return "performance";
  if (/\bfeature|add |support |implement |allow \b/.test(t)) return "feature";
  return "bug_fix";
}

function detectEffort(title) {
  const t = title.toLowerCase();
  if (/typo|missing|update.*doc|add.*test|example|rename/.test(t)) return "low";
  if (/refactor|rewrite|redesign|migrate/.test(t)) return "high";
  return "medium";
}

// Discover top repos from Cambodian community devs and refresh weekly
async function discoverCambodianRepos(state) {
  const lastScan = state.cambodia_last_scan;
  if (lastScan && ageDays(lastScan) < 7) {
    return state.cambodia_repos || [];
  }

  console.log("  [cambodia] scanning community repos...");
  const cambodiaRepos = [];

  for (const dev of CAMBODIA_DEVS) {
    const repos = gh(`api "users/${dev.login}/repos?sort=stars&per_page=8&type=public"`);
    if (!repos) continue;

    for (const repo of repos) {
      if (repo.fork || repo.archived || repo.stargazers_count < 3) continue;
      const existing = cambodiaRepos.find((r) => r.full_name === repo.full_name);
      if (!existing) {
        cambodiaRepos.push({
          full_name: repo.full_name,
          stars: repo.stargazers_count,
          owner: dev.login,
          why: dev.reason,
        });
        console.log(`  [cambodia] + ${repo.full_name} (${repo.stargazers_count}*)`);
      }
    }
  }

  // Also search for repos with khmer/cambodia topics
  try {
    const topicRaw = execSync(
      'gh api "search/repositories?q=topic:khmer+topic:cambodia&sort=stars&per_page=10"',
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 15000 }
    );
    const topicData = JSON.parse(topicRaw);
    for (const repo of topicData.items || []) {
      if (repo.archived || repo.fork) continue;
      if (!cambodiaRepos.find((r) => r.full_name === repo.full_name)) {
        cambodiaRepos.push({
          full_name: repo.full_name,
          stars: repo.stargazers_count,
          owner: repo.owner.login,
          why: `topic: khmer/cambodia, ${repo.stargazers_count} stars`,
        });
        console.log(`  [cambodia] + ${repo.full_name} (topic, ${repo.stargazers_count}*)`);
      }
    }
  } catch {}

  state.cambodia_repos = cambodiaRepos;
  state.cambodia_last_scan = new Date().toISOString();
  console.log(`  [cambodia] ${cambodiaRepos.length} community repos found`);
  return cambodiaRepos;
}

async function checkRepo(repo, state, cambodiaWhy) {
  const checked = state.repos_checked[repo];
  if (checked) {
    const age = ageDays(checked.last_checked);
    if (age < 1) {
      return; // checked in last 24h, skip
    }
  }

  // Skip repos where we already have a submitted PR
  const hasSubmitted = state.submitted_prs.some((p) => p.repo === repo);
  if (hasSubmitted) {
    state.repos_checked[repo] = {
      ...(checked || {}),
      last_checked: new Date().toISOString(),
      status: "pr_submitted",
    };
    return;
  }

  // Skip repos where we already have a high-confidence opportunity queued
  const hasQueued = state.opportunities.some(
    (o) => o.repo === repo && o.status === "opportunity"
  );
  if (hasQueued) {
    state.repos_checked[repo] = {
      ...(checked || {}),
      last_checked: new Date().toISOString(),
    };
    return;
  }

  console.log(`  checking: ${repo}`);

  // Vitality: how many PRs merged in last 60 days
  const sixtyAgo = new Date(Date.now() - 60 * 86400000).toISOString();
  const merged = gh(`pr list --repo ${repo} --state merged --limit 40 --json mergedAt`);
  if (!merged) {
    console.log(`  skip (gh api error): ${repo}`);
    return;
  }
  const vitality = merged.filter((p) => p.mergedAt > sixtyAgo).length;

  if (vitality < 2) {
    console.log(`  skip (low vitality ${vitality}): ${repo}`);
    state.repos_checked[repo] = { last_checked: new Date().toISOString(), vitality };
    return;
  }

  // Get open bug issues plus security issues (security merges fastest)
  const bugIssues = gh(
    `issue list --repo ${repo} --label bug --state open --limit 20 --json number,title,createdAt,comments,url,labels`
  ) || [];
  const secIssues = gh(
    `issue list --repo ${repo} --label security --state open --limit 15 --json number,title,createdAt,comments,url,labels`
  ) || [];
  // Merge, de-dupe by number (an issue can carry both labels)
  const issuesById = new Map();
  for (const i of [...secIssues, ...bugIssues]) issuesById.set(i.number, i);
  const issues = [...issuesById.values()];
  if (issues.length === 0) {
    console.log(`  no open bug/security issues: ${repo}`);
    state.repos_checked[repo] = { last_checked: new Date().toISOString(), vitality };
    return;
  }

  // Batch: get open PR titles+bodies once to check for competing PRs locally
  const openPRs = gh(
    `pr list --repo ${repo} --state open --limit 50 --json number,title,body`
  ) || [];
  const openPRText = openPRs.map((p) => `${p.title} ${p.body || ""}`).join(" ");

  let added = 0;
  for (const issue of issues) {
    const id = `${repo}#${issue.number}`;
    if (state.opportunities.some((o) => o.id === id)) continue;

    // Competing PR check: does any open PR mention this issue number?
    const refPattern = new RegExp(`#${issue.number}\\b`);
    const hasCompeting = refPattern.test(openPRText);
    if (hasCompeting) continue;

    const age = ageDays(issue.createdAt);
    const labelNames = (issue.labels || []).map((l) => l.name || l);
    const security = isSecurity({ title: issue.title, labels: labelNames });
    const confidence = scoreOpportunity({
      age,
      vitality,
      hasComment: issue.comments > 0,
      noCompetingPR: true,
      security,
    });

    if (confidence < 30) continue;

    const opp = {
      id,
      repo,
      issue_number: issue.number,
      issue_title: issue.title,
      issue_url: issue.url,
      opportunity_type: detectType(issue.title),
      effort: detectEffort(issue.title),
      confidence,
      activity_score: vitality,
      is_security: security,
      why: `${vitality} merged in 60d; ${age}d old; no competing PR${security ? "; SECURITY" : ""}`,
      status: "opportunity",
      found_at: new Date().toISOString(),
      age_days: age,
      is_favorite: state.favorites.includes(repo),
      ...(cambodiaWhy ? { cambodia_community: true, cambodia_why: cambodiaWhy } : {}),
    };

    state.opportunities.push(opp);
    added++;
    console.log(`  + ${id} (conf:${confidence})${security ? " [SECURITY]" : ""}`);
  }

  if (added === 0) {
    console.log(`  ${issues.length} issues checked, 0 new opportunities`);
  }

  state.repos_checked[repo] = { last_checked: new Date().toISOString(), vitality };
}

// Bot accounts / advisory-noise owners that spam auto-generated "security"
// issues we can never PR against. Skip them in the fresh-security sweep.
const SECURITY_NOISE =
  /argus|aishield|cve-checker|-nightly|leekiyoon|kovagent|mythrax|securitybot|security-bot|dependabot|snyk/i;

// Search GitHub for fresh, unassigned, uncommented security issues across all
// repos (not just the seed list). Security fixes get merged fastest, so an
// early, unclaimed one is the highest-value opportunity we can find.
async function sweepFreshSecurity(state) {
  console.log("  [security] sweeping fresh unclaimed security issues...");
  const since = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
  const q = `is:issue is:open no:assignee comments:0 label:security created:>${since}`;
  const raw = ghRaw(
    `api "search/issues?q=${encodeURIComponent(q)}&sort=created&order=desc&per_page=40"`
  );
  if (!raw) {
    console.log("  [security] search failed");
    return;
  }
  let items = [];
  try {
    items = JSON.parse(raw).items || [];
  } catch {
    return;
  }

  let added = 0;
  for (const it of items) {
    // repository_url ends in .../owner/name
    const parts = it.repository_url.split("/");
    const owner = parts[parts.length - 2];
    const repo = `${owner}/${parts[parts.length - 1]}`;
    if (SECURITY_NOISE.test(repo) || SECURITY_NOISE.test(it.user?.login || "")) continue;
    if (SECURITY_NOISE.test(it.title || "")) continue;
    // Skip owner-self-authored issues: on personal repos these are the owner's
    // own security to-do list (they fix them themselves) - not PR targets.
    if ((it.user?.login || "").toLowerCase() === owner.toLowerCase()) continue;
    // Skip repos we've already submitted to (1 PR per repo)
    if (state.submitted_prs.some((p) => p.repo === repo)) continue;
    const id = `${repo}#${it.number}`;
    if (state.opportunities.some((o) => o.id === id)) continue;

    const age = ageDays(it.created_at);
    const opp = {
      id,
      repo,
      issue_number: it.number,
      issue_title: it.title,
      issue_url: it.html_url,
      opportunity_type: "security",
      effort: detectEffort(it.title),
      confidence: 90, // fresh + unclaimed + security = top priority
      activity_score: 0,
      is_security: true,
      why: `fresh security issue (${age}d old), no assignee, no comments`,
      status: "opportunity",
      found_at: new Date().toISOString(),
      age_days: age,
      is_favorite: false,
      from_security_sweep: true,
    };
    state.opportunities.push(opp);
    added++;
    console.log(`  [security] + ${id} [SECURITY]`);
  }
  console.log(`  [security] ${added} fresh security opportunities added`);
}

async function main() {
  const now = new Date().toISOString();
  console.log(`=== discover.mjs ${now} ===`);

  // Check gh auth
  const authStatus = ghRaw("auth status");
  if (!authStatus.includes("Logged in")) {
    console.error("gh not authenticated - run: gh auth login");
    process.exit(1);
  }

  const state = readState();

  // Discover new repos from GitHub search
  let searchRepos = [];
  try {
    const raw = execSync(
      'gh search repos --language python --stars ">=500" --sort updated --order desc --limit 20 --json nameWithOwner',
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 15000 }
    );
    searchRepos = JSON.parse(raw).map((r) => r.nameWithOwner);
  } catch {
    console.log("  (search failed, using seed list)");
  }

  // Also search TypeScript/Go repos
  let searchReposTS = [];
  try {
    const raw = execSync(
      'gh search repos --language typescript --stars ">=1000" --sort updated --order desc --limit 10 --json nameWithOwner',
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 15000 }
    );
    searchReposTS = JSON.parse(raw).map((r) => r.nameWithOwner);
  } catch {}

  // Search PHP (Laravel) repos
  let searchReposPHP = [];
  try {
    const raw = execSync(
      'gh search repos --language php --stars ">=500" --sort updated --order desc --limit 10 --json nameWithOwner',
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 15000 }
    );
    searchReposPHP = JSON.parse(raw).map((r) => r.nameWithOwner);
  } catch {}

  // Search JavaScript/React repos
  let searchReposJS = [];
  try {
    const raw = execSync(
      'gh search repos --language javascript --stars ">=2000" --sort updated --order desc --limit 10 --json nameWithOwner',
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 15000 }
    );
    searchReposJS = JSON.parse(raw).map((r) => r.nameWithOwner);
  } catch {}

  // Discover Cambodian community repos
  const cambodiaRepos = await discoverCambodianRepos(state);
  const cambodiaWhyMap = Object.fromEntries(
    cambodiaRepos.map((r) => [r.full_name, r.why])
  );

  // Priority order: favorites, seeds, cambodia community, search results (deduped)
  const seen = new Set();
  const toCheck = [];
  for (const r of [
    ...state.favorites,
    ...SEED_REPOS,
    ...cambodiaRepos.map((r) => r.full_name),
    ...searchRepos,
    ...searchReposTS,
    ...searchReposPHP,
    ...searchReposJS,
  ]) {
    if (!seen.has(r)) {
      seen.add(r);
      toCheck.push(r);
    }
  }

  const cambodiaCount = cambodiaRepos.length;
  console.log(`Checking ${toCheck.length} repos (favorites first, ${cambodiaCount} cambodia community)`);

  for (const repo of toCheck) {
    try {
      await checkRepo(repo, state, cambodiaWhyMap[repo] || null);
    } catch (e) {
      console.log(`  error checking ${repo}: ${e.message}`);
    }
  }

  // Fresh-security sweep: search all of GitHub for brand-new, unclaimed
  // security issues. Fresh + unclaimed + security = fastest merges (this is
  // how tolokaforge#900 and mloda#1063 were landed same-day).
  await sweepFreshSecurity(state);

  // Sort opportunities: security first, then favorites, then confidence desc
  state.opportunities.sort((a, b) => {
    const aSec = a.is_security ? 1 : 0;
    const bSec = b.is_security ? 1 : 0;
    if (bSec !== aSec) return bSec - aSec;
    const aFav = state.favorites.includes(a.repo) ? 1 : 0;
    const bFav = state.favorites.includes(b.repo) ? 1 : 0;
    if (bFav !== aFav) return bFav - aFav;
    return b.confidence - a.confidence;
  });

  state.last_scan = now;
  writeState(state);

  const open = state.opportunities.filter((o) => o.status === "opportunity").length;
  console.log(`=== Done. ${open} open opportunities, ${state.opportunities.length} total ===`);
}

main().catch(console.error);
