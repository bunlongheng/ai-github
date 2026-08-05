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
