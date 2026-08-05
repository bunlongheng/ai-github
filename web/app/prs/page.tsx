import { fetchLivePRs } from "@/lib/prs";
import type { PRStatus } from "@/lib/prs";

export const dynamic = "force-dynamic";

const GRAD_COLORS = ["#0969da", "#8250df", "#bf3989", "#1a7f37", "#9a6700", "#1b9aaa"];

function OrgAvatar({ org }: { org: string }) {
  const init = (org || "?").slice(0, 1).toUpperCase();
  const bg = GRAD_COLORS[[...org].reduce((a, c) => a + c.charCodeAt(0), 0) % GRAD_COLORS.length];
  return (
    <span
      className="inline-flex items-center justify-center rounded-[5px] align-middle text-white text-[12px] font-bold shrink-0"
      style={{ width: 20, height: 20, background: bg }}
    >
      {init}
    </span>
  );
}

const HGRAD: Record<PRStatus, string> = {
  open: "from-blue-600 to-blue-800",
  merged: "from-green-600 to-emerald-700",
  draft: "from-gray-400 to-gray-500",
  closed: "from-rose-300 to-rose-400",
};

const PILL_CLS: Record<PRStatus, string> = {
  open: "bg-blue-50 text-blue-700 border border-blue-200",
  merged: "bg-green-50 text-green-700 border border-green-200",
  draft: "bg-gray-100 text-gray-500",
  closed: "bg-red-50 text-red-600 border border-red-200",
};

const STATUS_LABEL: Record<PRStatus, string> = {
  open: "Open",
  merged: "Merged",
  draft: "Draft",
  closed: "Closed",
};

const GROUP_ORDER: PRStatus[] = ["open", "merged", "draft", "closed"];

function statusPill(status: PRStatus) {
  return (
    <span
      className={`text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${PILL_CLS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function agoLabel(d?: string | null): string {
  if (!d) return "";
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return "";
  const days = Math.max(0, Math.floor((Date.now() - t) / 86400000));
  return days === 0 ? "today" : `${days}d ago`;
}

function formatDate(d: string): string {
  const dt = new Date(`${d}T00:00:00`);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function PRsBoard() {
  const prs = await fetchLivePRs();

  const counts: Record<PRStatus, number> = { open: 0, merged: 0, draft: 0, closed: 0 };
  for (const pr of prs) {
    const s = pr.liveStatus ?? "open";
    counts[s] = (counts[s] || 0) + 1;
  }

  const total = prs.length;
  const mergedCount = counts.merged;
  const closedCount = counts.closed;
  const acceptanceRate =
    mergedCount + closedCount > 0
      ? Math.round((mergedCount / (mergedCount + closedCount)) * 100)
      : 0;

  const groups = GROUP_ORDER.map((status) => ({
    status,
    rows: prs.filter((pr) => (pr.liveStatus ?? "open") === status),
  })).filter((g) => g.rows.length > 0);

  const summaryTiles: { label: string; count: number; grad: string }[] = [
    { label: "Total", count: total, grad: "from-gray-700 to-gray-900" },
    ...(counts.open > 0 ? [{ label: "Open", count: counts.open, grad: HGRAD.open }] : []),
    ...(counts.draft > 0 ? [{ label: "Draft", count: counts.draft, grad: HGRAD.draft }] : []),
    ...(counts.merged > 0 ? [{ label: "Merged", count: counts.merged, grad: HGRAD.merged }] : []),
    ...(counts.closed > 0 ? [{ label: "Rejected", count: counts.closed, grad: HGRAD.closed }] : []),
  ];

  return (
    <main
      className="min-h-screen bg-[#f6f8fa] text-[#1f2328]"
      style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}
    >
      <div className="max-w-[900px] mx-auto px-5 py-7 pb-16">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1f2328] mb-1">PRs</h1>
            <div className="text-[13px] text-gray-500">
              {total} tracked &middot; live from GitHub API &middot; {acceptanceRate}% acceptance
            </div>
          </div>
        </div>

        {/* Summary tiles */}
        <div className="flex flex-wrap gap-2 mb-6">
          {summaryTiles.map((tile) => (
            <div
              key={tile.label}
              className={`flex-1 min-w-[88px] rounded-[10px] px-2.5 py-2.5 sm:px-4 sm:py-3 text-white shadow-sm bg-gradient-to-r ${tile.grad}`}
            >
              <div className="text-[20px] sm:text-[26px] font-bold leading-none">{tile.count}</div>
              <div className="text-[10px] sm:text-xs text-white/85 mt-0.5 truncate">{tile.label}</div>
            </div>
          ))}
        </div>

        {/* Kanban panels */}
        {groups.map((g) => (
          <div
            key={g.status}
            className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          >
            {/* Panel header */}
            <div
              className={`bg-gradient-to-r ${HGRAD[g.status]} px-4 py-2.5 flex items-center gap-2`}
            >
              <h3 className="text-sm font-bold text-white tracking-wide">
                {STATUS_LABEL[g.status]}
              </h3>
              <span className="text-xs font-bold text-white bg-white/30 rounded-full px-2.5 py-0.5">
                {g.rows.length}
              </span>
            </div>

            {/* Table */}
            <table className="w-full table-fixed border-collapse text-[11px] sm:text-[13px]">
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "42%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
              </colgroup>
              <thead>
                <tr className="bg-[#f6f8fa] text-gray-400 text-[11px] text-left">
                  <th className="pl-3 pr-1 py-2 font-medium">Repo</th>
                  <th className="px-2.5 py-2 font-medium">Title</th>
                  <th className="px-1.5 py-2 font-medium">Issue</th>
                  <th className="px-1.5 py-2 font-medium">Submitted</th>
                  <th className="pl-1 pr-3 py-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((pr) => {
                  const [org, repoName] = (pr.repo || "/").split("/");
                  const displayTitle = pr.liveTitle || pr.title;
                  const submittedAgo = agoLabel(`${pr.submittedAt}T00:00:00`);
                  const dateLabel = formatDate(pr.submittedAt);

                  return (
                    <tr
                      key={`${pr.repo}-${pr.number}`}
                      className="border-t border-gray-100 hover:bg-blue-50 transition-colors"
                    >
                      {/* Repo */}
                      <td className="pl-3 pr-1 py-2">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <OrgAvatar org={org} />
                          <span className="truncate text-[#1f2328]">{repoName}</span>
                        </span>
                      </td>

                      {/* Title */}
                      <td className="px-2.5 py-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="flex-1 min-w-0 truncate text-[#1f2328]">
                            {displayTitle}
                          </span>
                          {pr.url ? (
                            <a
                              href={pr.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`PR #${pr.number}`}
                              className="shrink-0 text-blue-700 no-underline align-middle"
                            >
                              &#8599;
                            </a>
                          ) : null}
                        </div>
                      </td>

                      {/* Issue */}
                      <td className="px-1.5 py-2 text-gray-500 text-[11px]">{pr.issue}</td>

                      {/* Submitted */}
                      <td className="px-1.5 py-2 text-gray-500 text-[11px] whitespace-nowrap">
                        <span title={pr.submittedAt}>{dateLabel}</span>
                        {submittedAgo ? (
                          <span className="ml-1 text-gray-400">({submittedAgo})</span>
                        ) : null}
                      </td>

                      {/* Status */}
                      <td className="pl-1 pr-3 py-2 text-right">{statusPill(g.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        {/* Footer stats */}
        <div className="mt-8 text-center text-xs text-gray-400">
          PRs &middot; live from GitHub API &middot; localhost:3018 &middot;{" "}
          {mergedCount + closedCount > 0
            ? `${mergedCount} merged / ${mergedCount + closedCount} resolved = ${acceptanceRate}% success rate`
            : "no resolved PRs yet"}
        </div>
      </div>
    </main>
  );
}
