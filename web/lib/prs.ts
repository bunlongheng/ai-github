export type PRStatus = "draft" | "open" | "merged" | "closed";

export interface PR {
  number: number;
  repo: string;        // "marimo-team/marimo"
  title: string;       // our intended title (for reference)
  issue: string;       // "#9624"
  submittedAt: string; // "2026-08-05"
  // fetched live:
  liveStatus?: PRStatus;
  liveTitle?: string;
  mergedAt?: string | null;
  closedAt?: string | null;
  url?: string;
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
  return Promise.all(PR_CATALOG.map(fetchOnePR));
}
