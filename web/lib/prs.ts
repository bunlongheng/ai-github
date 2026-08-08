export type PRStatus = "draft" | "open" | "merged" | "closed";

export type PRCategory =
  | "security"
  | "correctness"
  | "performance"
  | "feature"
  | "enhancement";

export type RepoType = "game" | "ai" | "lib" | "app" | "tool" | "api";

const REPO_TYPE_MAP: Record<string, RepoType> = {
  "DexterHuang/CyberCodeOnline": "game",
  "openfrontio/OpenFrontIO":      "game",
  "ill-inc/biomes-game":          "game",
  "benlikescode/geohub":          "game",
  "BerriAI/litellm":              "ai",
  "567-labs/instructor":          "ai",
  "mloda-ai/mloda":               "ai",
  "Toloka/tolokaforge":           "ai",
  "open-webui/open-webui":        "ai",
  "steipete/summarize":           "ai",
  "garrytan/gbrain":              "ai",
  "remsky/Kokoro-FastAPI":        "ai",
  "openai/openai-python":         "ai",
  "pydantic/pydantic":            "lib",
  "pallets/click":                "lib",
  "charmbracelet/bubbletea":      "lib",
  "recharts/recharts":            "lib",
  "shadcn-ui/ui":                 "lib",
  "spatie/laravel-medialibrary":  "lib",
  "trpc/trpc":                    "lib",
  "seanghay/sone":                "lib",
  "bizz84/starter_architecture_flutter_firebase": "lib",
  "simonw/datasette":             "tool",
  "simonw/sqlite-utils":          "tool",
  "charmbracelet/glow":           "tool",
  "openclaw/crabbox":             "tool",
  "openclaw/crabpot":             "tool",
  "openclaw/acpx":                "tool",
  "openclaw/gogcli":              "tool",
  "garrytan/gstack":              "tool",
  "steipete/oracle":              "tool",
  "jdx/mise":                     "tool",
  "marimo-team/marimo":           "app",
  "goauthentik/authentik":        "app",
  "block/buzz":                   "app",
  "dgloeckner/clubbar":           "app",
  "t33r-code/flash-me":           "app",
  "cryptoadvance/specter-desktop": "app",
  "rush86999/atom":                "app",
  "mr-karan/logchef":             "tool",
  "doronz88/pymobiledevice3":     "tool",
  "mariadb-operator/mariadb-operator": "tool",
  "shamanec/GADS":                "tool",
  "chrisbenincasa/tunarr":        "app",
  "nodetool-ai/nodetool":         "ai",
  "jaypipes/ghw":                 "lib",
  "hoppscotch/hoppscotch":        "app",
  "sourcegraph/src-cli":          "tool",
  "j3ssie/osmedeus":              "tool",
  "httpie/cli":                   "tool",
  "nektos/act":                   "tool",
  "pydantic/logfire":             "lib",
};

export function repoTypeOf(repo: string): RepoType {
  return REPO_TYPE_MAP[repo] ?? "app";
}

export interface PR {
  number: number;
  repo: string;        // "marimo-team/marimo"
  title: string;       // our intended title (for reference)
  issue: string;       // "#9624"
  submittedAt: string; // "2026-08-05"
  category?: PRCategory;
  repoType?: RepoType;
  // fetched live:
  liveStatus?: PRStatus;
  liveTitle?: string;
  mergedAt?: string | null;
  closedAt?: string | null;
  url?: string;
}

// Explicit category for known PRs (authoritative). Loop-added PRs not listed
// here fall back to inferCategory() below.
const PR_CATEGORY: Record<number, PRCategory> = {
  3579: "security",   // openai-python: expand SENSITIVE_HEADERS
  828: "security",    // sqlite-utils: SQL injection escape
  1005: "security",   // glow: HTTP timeout / DoS
  2507: "security",   // instructor: request timeouts / DoS
  35965: "feature",   // litellm: track Google Maps grounding cost
  11413: "enhancement", // shadcn: remove unused default fonts
  3765: "security",   // CyberCodeOnline: restrict validate-json workflow to read-only token
  11764: "security",  // mise: validate aqua registry file names against path traversal
  124: "security",    // geohub: bump next to patch CVE-2025-29927
};

// Fallback categorizer for PRs not in PR_CATEGORY (keeps the board correct as
// the loop adds new entries).
export function inferCategory(pr: { title: string; issue: string }): PRCategory {
  const t = (pr.title || "").toLowerCase();
  if (
    pr.issue === "security-audit" ||
    /\binject|traversal|ssrf|xss|csrf|secret|credential|token|sanitiz|escape|vuln|cve|auth bypass|arbitrary|overflow|redos|\bdos\b|timeout/.test(t)
  )
    return "security";
  if (/\bperf|slow|memory|leak|optim|latency|twice|duplicate\b/.test(t)) return "performance";
  if (/\bfeat|add |support |track |implement /.test(t)) return "feature";
  if (/\bremove|unused|cleanup|rename|refactor|deprecat/.test(t)) return "enhancement";
  return "correctness";
}

export function categoryOf(pr: { number: number; title: string; issue: string }): PRCategory {
  return PR_CATEGORY[pr.number] ?? inferCategory(pr);
}

// The catalog - add new PRs here when submitted
export const PR_CATALOG: Omit<PR, "liveStatus" | "liveTitle" | "mergedAt" | "closedAt" | "url">[] = [
  {
    number: 10465,
    repo: "marimo-team/marimo",
    title: "fix: resolve mo.lazy content eagerly during static HTML export",
    issue: "#9624",
    submittedAt: "2026-08-05",
  },
  {
    number: 3578,
    repo: "openai/openai-python",
    title: "fix: remove duplicate accumulate_delta in assistants streaming",
    issue: "architect-audit",
    submittedAt: "2026-08-05",
  },
  {
    number: 3579,
    repo: "openai/openai-python",
    title: "fix: expand SENSITIVE_HEADERS to cover proxy and gateway credential headers",
    issue: "security-audit",
    submittedAt: "2026-08-05",
  },
  {
    number: 163,
    repo: "bizz84/starter_architecture_flutter_firebase",
    title: "fix: show loading screen immediately when tapping Retry",
    issue: "#147",
    submittedAt: "2026-08-05",
  },
  {
    number: 6,
    repo: "seanghay/sone",
    title: "fix: use continue instead of return for null cell guard in table spacing loop",
    issue: "code-audit",
    submittedAt: "2026-08-05",
  },
  {
    number: 3748,
    repo: "pallets/click",
    title: "Fix progressbar show_pos not showing final position with update_min_steps",
    issue: "#3571",
    submittedAt: "2026-08-05",
  },
  {
    number: 1754,
    repo: "charmbracelet/bubbletea",
    title: "fix: assign MouseButton11 = uv.MouseButton11 (was silently equal to MouseButton10)",
    issue: "code-audit",
    submittedAt: "2026-08-05",
  },
  {
    number: 2871,
    repo: "simonw/datasette",
    title: "Fix transaction wrapping for sqlite-utils 4.0 compatibility",
    issue: "#2831",
    submittedAt: "2026-08-05",
  },
  {
    number: 11412,
    repo: "shadcn-ui/ui",
    title: "fix(tailwind): match bare data-selected attribute in data-selected variant",
    issue: "#11101",
    submittedAt: "2026-08-05",
  },
  {
    number: 35965,
    repo: "BerriAI/litellm",
    title: "fix(gemini): track cost for Grounding with Google Maps",
    issue: "#35906",
    submittedAt: "2026-08-05",
  },
  {
    number: 11413,
    repo: "shadcn-ui/ui",
    title: "fix(shadcn): remove unused default Next.js fonts when init replaces them",
    issue: "#11124",
    submittedAt: "2026-08-05",
  },
  {
    number: 13594,
    repo: "pydantic/pydantic",
    title: "Fix model validators called twice with recursive models",
    issue: "#13581",
    submittedAt: "2026-08-05",
  },
  {
    number: 1065,
    repo: "mloda-ai/mloda",
    title: "fix(options): NON_FORWARDED_KEYS stores enum values not members",
    issue: "#1063",
    submittedAt: "2026-08-06",
  },
  {
    number: 902,
    repo: "Toloka/tolokaforge",
    title: "fix(grading): set RequiredAction extra=forbid to catch typos at load time",
    issue: "#900",
    submittedAt: "2026-08-06",
  },
  {
    number: 828,
    repo: "simonw/sqlite-utils",
    title: "Escape tokenize argument in enable_fts to prevent SQL injection",
    issue: "security-audit",
    submittedAt: "2026-08-06",
  },
  {
    number: 1005,
    repo: "charmbracelet/glow",
    title: "Add HTTP client timeout to remote fetches to prevent hang/DoS",
    issue: "security-audit",
    submittedAt: "2026-08-06",
  },
  {
    number: 2507,
    repo: "567-labs/instructor",
    title: "Add request timeouts to remote media fetches to prevent hang/DoS",
    issue: "security-audit",
    submittedAt: "2026-08-06",
  },
  {
    number: 7620,
    repo: "recharts/recharts",
    title: "fix: guard reduceCSSCalc against ReDoS from pathological calc() input",
    issue: "security-audit",
    submittedAt: "2026-08-06",
  },
  {
    number: 7,
    repo: "seanghay/sone",
    title: "fix: clamp SVG rasterization size to prevent memory-exhaustion DoS",
    issue: "security-audit",
    submittedAt: "2026-08-06",
  },
  {
    number: 1072,
    repo: "mloda-ai/mloda",
    title: "fix(security): quote SQL identifiers in SQLITEReader.build_query",
    issue: "security-audit",
    submittedAt: "2026-08-06",
  },
  {
    number: 1253,
    repo: "openclaw/crabbox",
    title: "fix(sync): report actionable error for non-Git workdir",
    issue: "#1248",
    submittedAt: "2026-08-06",
  },
  {
    number: 3849,
    repo: "garrytan/gbrain",
    title: "fix(serve-http): default-deny OAuth CORS preflight on /token, /revoke, /register",
    issue: "#3845",
    submittedAt: "2026-08-06",
  },
  {
    number: 7460,
    repo: "trpc/trpc",
    title: "fix(server): reject line breaks and null chars in tracked() SSE ids",
    issue: "security-audit",
    submittedAt: "2026-08-06",
  },
  {
    number: 28220,
    repo: "open-webui/open-webui",
    title: "build: bump undici to ^7.29.0 to fix CVE-2026-13697 and 4 related CVEs",
    issue: "CVE-2026-13697",
    submittedAt: "2026-08-06",
  },
  {
    number: 960,
    repo: "openclaw/gogcli",
    title: "fix(gmail): redact embedded credentials in watch hook URL output",
    issue: "security-audit",
    submittedAt: "2026-08-06",
  },
  {
    number: 2468,
    repo: "garrytan/gstack",
    title: "fix(design): create OpenAI key file owner-only to close write-then-chmod race",
    issue: "security-audit",
    submittedAt: "2026-08-06",
  },
  {
    number: 380,
    repo: "steipete/summarize",
    title: "fix(security): route remote asset fetch through the SSRF network guard",
    issue: "security-audit",
    submittedAt: "2026-08-06",
  },
  {
    number: 284,
    repo: "openclaw/crabpot",
    title: "fix(security): reject path traversal in fixture manifest paths",
    issue: "security-audit",
    submittedAt: "2026-08-06",
  },
  {
    number: 493,
    repo: "openclaw/acpx",
    title: "fix(security): contain replay viewer bundle projection paths",
    issue: "security-audit",
    submittedAt: "2026-08-06",
  },
  {
    number: 359,
    repo: "steipete/oracle",
    title: "fix(security): restrict session artifact file permissions to owner-only",
    issue: "security-audit",
    submittedAt: "2026-08-06",
  },
  {
    number: 500,
    repo: "remsky/Kokoro-FastAPI",
    title: "build: bump fastapi + pin starlette>=1.3.1 to fix CVE-2025-62727 (DoS via FileResponse)",
    issue: "CVE-2025-62727",
    submittedAt: "2026-08-06",
  },
  {
    number: 176,
    repo: "dgloeckner/clubbar",
    title: "fix(security): move IBAN out of GET query params in bank lookup",
    issue: "security-audit",
    submittedAt: "2026-08-07",
  },
  {
    number: 336,
    repo: "t33r-code/flash-me",
    title: "fix(security): cap the real inflated size per import entry to block understated zip bombs",
    issue: "security-audit",
    submittedAt: "2026-08-07",
  },
  {
    number: 3961,
    repo: "spatie/laravel-medialibrary",
    title: "Decode remote url path before stripping directory in addMediaFromUrl",
    issue: "security-audit",
    submittedAt: "2026-08-07",
  },
  {
    number: 24888,
    repo: "goauthentik/authentik",
    title: "Use constant-time comparison for secret key in SecretKeyFilter",
    issue: "security-audit",
    submittedAt: "2026-08-07",
  },
  {
    number: 5239,
    repo: "block/buzz",
    title: "fix(auth): match bracketed ::1 host in NIP-42 relay url check",
    issue: "security-audit",
    submittedAt: "2026-08-07",
  },
  {
    number: 3765,
    repo: "DexterHuang/CyberCodeOnline",
    title: "ci: restrict validate-json workflow to read-only token",
    issue: "security-audit",
    submittedAt: "2026-08-07",
  },
  {
    number: 11764,
    repo: "jdx/mise",
    title: "fix(aqua): validate registry file names against path traversal",
    issue: "security-audit",
    submittedAt: "2026-08-07",
  },
  {
    number: 124,
    repo: "benlikescode/geohub",
    title: "fix: bump next from 12.2.4 to 12.3.6 to patch CVE-2025-29927",
    issue: "CVE-2025-29927",
    submittedAt: "2026-08-07",
  },
  {
    number: 2687,
    repo: "cryptoadvance/specter-desktop",
    title: "fix(swan): add timeout to remote HTTP requests to prevent hang",
    issue: "security-audit",
    submittedAt: "2026-08-08",
  },
  {
    number: 579,
    repo: "rush86999/atom",
    title: "fix(auth): add timeout to OAuth token exchange request",
    issue: "security-audit",
    submittedAt: "2026-08-08",
  },
  {
    number: 99,
    repo: "mr-karan/logchef",
    title: "fix(clickhouse): validate identifier names before interpolating into queries",
    issue: "security-audit",
    submittedAt: "2026-08-08",
  },
  {
    number: 1842,
    repo: "doronz88/pymobiledevice3",
    title: "fix: add timeout to outbound HTTP requests to prevent hang",
    issue: "security-audit",
    submittedAt: "2026-08-08",
  },
  {
    number: 1866,
    repo: "mariadb-operator/mariadb-operator",
    title: "fix(security): replace world-writable 0777 modes with restrictive permissions",
    issue: "security-audit",
    submittedAt: "2026-08-08",
  },
  {
    number: 351,
    repo: "shamanec/GADS",
    title: "fix(archive): check zip entry paths stay within destination directory",
    issue: "security-audit",
    submittedAt: "2026-08-08",
  },
  {
    number: 1982,
    repo: "chrisbenincasa/tunarr",
    title: "fix(api): contain troubleshoot file reads within session temp directory",
    issue: "security-audit",
    submittedAt: "2026-08-08",
  },
  {
    number: 4787,
    repo: "nodetool-ai/nodetool",
    title: "fix(security): block IPv6-mapped and decimal-encoded IPs in SSRF guard",
    issue: "security-audit",
    submittedAt: "2026-08-08",
  },
  {
    number: 472,
    repo: "jaypipes/ghw",
    title: "fix(snapshot): contain tar entry paths within destination directory",
    issue: "security-audit",
    submittedAt: "2026-08-08",
  },
  {
    number: 6562,
    repo: "hoppscotch/hoppscotch",
    title: "fix(context-menu): remove catastrophic backtracking in URL detection regex",
    issue: "security-audit",
    submittedAt: "2026-08-08",
  },
  {
    number: 1360,
    repo: "sourcegraph/src-cli",
    title: "fix(search-jobs): add timeout to authenticated HTTP requests",
    issue: "security-audit",
    submittedAt: "2026-08-08",
  },
  {
    number: 318,
    repo: "j3ssie/osmedeus",
    title: "fix(installer): validate symlink targets stay within extraction directory",
    issue: "security-audit",
    submittedAt: "2026-08-08",
  },
  {
    number: 1920,
    repo: "httpie/cli",
    title: "fix(update): add timeout to PyPI version check request",
    issue: "security-audit",
    submittedAt: "2026-08-08",
  },
  {
    number: 6157,
    repo: "nektos/act",
    title: "fix(security): add timeout to notices HTTP client and path guard to file collector",
    issue: "security-audit",
    submittedAt: "2026-08-08",
  },
  {
    number: 2217,
    repo: "pydantic/logfire",
    title: "fix(auth,client): add timeout to outbound HTTP session requests",
    issue: "security-audit",
    submittedAt: "2026-08-08",
  },
];

async function fetchOnePR(pr: Omit<PR, "liveStatus" | "liveTitle" | "mergedAt" | "closedAt" | "url">): Promise<PR> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${pr.repo}/pulls/${pr.number}`,
      { headers, next: { revalidate: 300 } }
    );
    if (res.ok) {
      const data = await res.json();
      const status: PRStatus = data.merged_at
        ? "merged"
        : data.draft
        ? "draft"
        : data.state === "closed"
        ? "closed"
        : "open";
      return {
        ...pr,
        liveStatus: status,
        liveTitle: data.title as string,
        mergedAt: data.merged_at as string | null,
        closedAt: data.closed_at as string | null,
        url: data.html_url as string,
      };
    }
    return { ...pr, liveStatus: "open" };
  } catch {
    return { ...pr, liveStatus: "open" };
  }
}

export async function fetchLivePRs(): Promise<PR[]> {
  const prs = await Promise.all(PR_CATALOG.map(fetchOnePR));
  return prs.map((p) => ({ ...p, category: categoryOf(p), repoType: repoTypeOf(p.repo) }));
}
