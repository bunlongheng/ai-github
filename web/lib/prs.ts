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
];

export async function fetchLivePRs(): Promise<PR[]> {
  const results: PR[] = [];
  for (const pr of PR_CATALOG) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${pr.repo}/pulls/${pr.number}`,
        {
          headers: { Accept: "application/vnd.github+json" },
          next: { revalidate: 300 }, // cache 5 min
        }
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
        results.push({
          ...pr,
          liveStatus: status,
          liveTitle: data.title,
          mergedAt: data.merged_at,
          closedAt: data.closed_at,
          url: data.html_url,
        });
      } else {
        results.push({ ...pr, liveStatus: "open" });
      }
    } catch {
      results.push({ ...pr, liveStatus: "open" });
    }
  }
  return results;
}
