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
  "charmbracelet/bubbletea",
  "charmbracelet/lipgloss",
  "charmbracelet/glow",
  "cli/cli",
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

function scoreOpportunity({ age, vitality, hasComment, noCompetingPR }) {
  let score = 0;
  if (noCompetingPR) score += 40;
  if (vitality >= 8) score += 25;
  else if (vitality >= 5) score += 18;
  else if (vitality >= 3) score += 12;
  else if (vitality >= 1) score += 5;
  if (age >= 30 && age <= 180) score += 20;
  else if (age > 180 && age <= 365) score += 10;
  if (hasComment) score += 15;
  return Math.min(score, 100);
}

function detectType(title) {
  const t = title.toLowerCase();
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

async function checkRepo(repo, state) {
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

  // Get all open bug issues
  const issues = gh(
    `issue list --repo ${repo} --label bug --state open --limit 20 --json number,title,createdAt,comments,url`
  );
  if (!issues || issues.length === 0) {
    console.log(`  no open bug issues: ${repo}`);
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
    const confidence = scoreOpportunity({
      age,
      vitality,
      hasComment: issue.comments > 0,
      noCompetingPR: true,
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
      why: `${vitality} merged in 60d; ${age}d old; no competing PR`,
      status: "opportunity",
      found_at: new Date().toISOString(),
      age_days: age,
      is_favorite: state.favorites.includes(repo),
    };

    state.opportunities.push(opp);
    added++;
    console.log(`  + ${id} (conf:${confidence})`);
  }

  if (added === 0) {
    console.log(`  ${issues.length} issues checked, 0 new opportunities`);
  }

  state.repos_checked[repo] = { last_checked: new Date().toISOString(), vitality };
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

  // Priority order: favorites, seeds, search results (deduped)
  const seen = new Set();
  const toCheck = [];
  for (const r of [
    ...state.favorites,
    ...SEED_REPOS,
    ...searchRepos,
    ...searchReposTS,
  ]) {
    if (!seen.has(r)) {
      seen.add(r);
      toCheck.push(r);
    }
  }

  console.log(`Checking ${toCheck.length} repos (favorites first)`);

  for (const repo of toCheck) {
    try {
      await checkRepo(repo, state);
    } catch (e) {
      console.log(`  error checking ${repo}: ${e.message}`);
    }
  }

  // Sort opportunities: favorites first, then by confidence desc
  state.opportunities.sort((a, b) => {
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
