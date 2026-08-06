import Image from "next/image";
import { fetchLivePRs } from "@/lib/prs";
import type { PRStatus, PRCategory } from "@/lib/prs";

export const dynamic = "force-dynamic";

const CAT_CLS: Record<PRCategory, string> = {
  security: "bg-red-50 text-red-700 border border-red-200",
  correctness: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  performance: "bg-amber-50 text-amber-700 border border-amber-200",
  feature: "bg-teal-50 text-teal-700 border border-teal-200",
  enhancement: "bg-gray-100 text-gray-600 border border-gray-200",
};

const CAT_LABEL: Record<PRCategory, string> = {
  security: "Security",
  correctness: "Correctness",
  performance: "Performance",
  feature: "Feature",
  enhancement: "Enhancement",
};

// Inline monochrome icons (inherit currentColor) - no icon dependency, matches
// the clean board aesthetic. Lucide-style stroke paths.
function Icon({ name, className = "" }: { name: string; className?: string }) {
  const p = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
  switch (name) {
    case "security": // shield
      return <svg {...p}><path d="M12 2l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V5l8-3z" /></svg>;
    case "correctness": // check-circle
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></svg>;
    case "performance": // bolt
      return <svg {...p}><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></svg>;
    case "feature": // sparkle
      return <svg {...p}><path d="M12 2l2.4 6.3L21 11l-6.6 2.7L12 20l-2.4-6.3L3 11l6.6-2.7z" /></svg>;
    case "enhancement": // wand
      return <svg {...p}><path d="M3 21l7-7M13 4l7 7M14 3l3-1 2 2-1 3M9 8l7 7" /></svg>;
    case "total": // layers
      return <svg {...p}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></svg>;
    case "open": // pull-request
      return <svg {...p}><circle cx="7" cy="6" r="2.3" /><circle cx="7" cy="18" r="2.3" /><path d="M7 8.3v7.4M17 8v8" /><circle cx="17" cy="6" r="2.3" /></svg>;
    case "merged": // git-merge
      return <svg {...p}><circle cx="7" cy="6" r="2.3" /><circle cx="7" cy="18" r="2.3" /><path d="M7 8.3v7.4" /><circle cx="17" cy="8" r="2.3" /><path d="M17 10.3c0 4-4 4.5-7 5.4" /></svg>;
    case "closed": // x-circle
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg>;
    case "draft": // pencil
      return <svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2 2 0 013 3L7 19l-4 1 1-4z" /></svg>;
    default:
      return null;
  }
}

const CAT_ICON: Record<PRCategory, string> = {
  security: "security",
  correctness: "correctness",
  performance: "performance",
  feature: "feature",
  enhancement: "enhancement",
};

function categoryChip(cat?: PRCategory) {
  if (!cat) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 whitespace-nowrap ${CAT_CLS[cat]}`}
    >
      <Icon name={CAT_ICON[cat]} className="w-2.5 h-2.5 shrink-0" />
      {CAT_LABEL[cat]}
    </span>
  );
}

const GRAD_COLORS = ["#0969da", "#8250df", "#bf3989", "#1a7f37", "#9a6700", "#1b9aaa"];

function OrgAvatar({ org }: { org: string }) {
  const init = (org || "?").slice(0, 1).toUpperCase();
  const bg = GRAD_COLORS[[...org].reduce((a, c) => a + c.charCodeAt(0), 0) % GRAD_COLORS.length];
  // Show the org's GitHub avatar (its real icon/logo); the colored monogram
  // sits behind as the generic fallback if the image is missing/slow.
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-[5px] align-middle text-white text-[12px] font-bold shrink-0 overflow-hidden"
      style={{ width: 20, height: 20, background: bg }}
    >
      {init}
      <Image
        src={`https://github.com/${org}.png?size=40`}
        alt={org}
        width={20}
        height={20}
        unoptimized
        className="absolute inset-0 h-full w-full object-cover"
      />
    </span>
  );
}

const HGRAD: Record<PRStatus, string> = {
  open: "from-blue-600 to-blue-800",
  merged: "from-green-600 to-emerald-700",
  draft: "from-gray-400 to-gray-600",
  closed: "from-rose-500 to-rose-700",
};

const HOVER: Record<PRStatus, string> = {
  open: "hover:bg-blue-50",
  merged: "hover:bg-green-50",
  draft: "hover:bg-gray-50",
  closed: "hover:bg-rose-50",
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

function statusPill(status: PRStatus, agoSlot?: string) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 text-center ${PILL_CLS[status]}`}
        style={{ width: 52, display: "inline-block" }}
      >
        {STATUS_LABEL[status]}
      </span>
      <span className="text-[10px] text-gray-400" style={{ width: 46, display: "inline-block" }}>
        {agoSlot ?? ""}
      </span>
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

  const catCounts = prs.reduce((m, pr) => {
    const c = pr.category;
    if (c) m[c] = (m[c] || 0) + 1;
    return m;
  }, {} as Record<PRCategory, number>);
  const catOrder: PRCategory[] = ["security", "correctness", "performance", "feature", "enhancement"];

  const total = prs.length;
  const mergedCount = counts.merged;
  const closedCount = counts.closed;
  const acceptanceRate =
    mergedCount + closedCount > 0
      ? Math.round((mergedCount / (mergedCount + closedCount)) * 100)
      : 0;

  // Latest PR on top: newest submittedAt first, then highest PR number.
  const byNewest = (a: { submittedAt: string; number: number }, b: { submittedAt: string; number: number }) =>
    b.submittedAt.localeCompare(a.submittedAt) || b.number - a.number;

  const groups = GROUP_ORDER.map((status) => ({
    status,
    rows: prs.filter((pr) => (pr.liveStatus ?? "open") === status).sort(byNewest),
  })).filter((g) => g.rows.length > 0);

  return (
    <main
      className="min-h-screen bg-[#f6f8fa] text-[#1f2328]"
      style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}
    >
      <div className="max-w-[900px] mx-auto px-5 py-7 pb-16">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-[#1f2328]">PRs</h1>
              <a href="/discover" className="text-[13px] text-blue-600 hover:underline">
                Discover &rarr;
              </a>
            </div>
            <div className="text-[13px] text-gray-500">
              {total} tracked &middot; live from GitHub API &middot;{" "}
              {mergedCount + closedCount > 0 ? `${acceptanceRate}% acceptance` : "no resolved yet"}
            </div>
          </div>
        </div>

        {/* Summary tiles */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="relative flex-1 min-w-[88px] rounded-[10px] px-2.5 py-2.5 sm:px-4 sm:py-3 text-white shadow-sm bg-gradient-to-r from-gray-700 to-gray-900">
            <Icon name="total" className="w-4 h-4 absolute top-2 right-2 text-white/40" />
            <div className="text-[20px] sm:text-[26px] font-bold leading-none">{total}</div>
            <div className="text-[10px] sm:text-xs text-white/85 mt-0.5 truncate">Total</div>
          </div>
          {(["open", "draft", "merged", "closed"] as PRStatus[]).filter((s) => counts[s] > 0).map((s) => (
            <div
              key={s}
              className={`relative flex-1 min-w-[88px] rounded-[10px] px-2.5 py-2.5 sm:px-4 sm:py-3 text-white shadow-sm bg-gradient-to-r ${HGRAD[s]}`}
            >
              <Icon name={s} className="w-4 h-4 absolute top-2 right-2 text-white/40" />
              <div className="text-[20px] sm:text-[26px] font-bold leading-none">{counts[s]}</div>
              <div className="text-[10px] sm:text-xs text-white/85 mt-0.5 truncate">
                {s === "closed" ? "Rejected" : STATUS_LABEL[s]}
              </div>
            </div>
          ))}
        </div>

        {/* Category mix */}
        <div className="flex flex-wrap items-center gap-2 mb-6 -mt-2">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">By category</span>
          {catOrder.filter((c) => catCounts[c] > 0).map((c) => (
            <span key={c} className="inline-flex items-center gap-1">
              {categoryChip(c)}
              <span className="text-[12px] font-bold text-gray-600">{catCounts[c]}</span>
            </span>
          ))}
        </div>

        {/* Kanban panels */}
        {groups.map((g) => {
          // per-repo breakdown for header chips
          const byOrg = g.rows.reduce((m, r) => {
            const org = (r.repo || "/").split("/")[0];
            m[org] = (m[org] || 0) + 1;
            return m;
          }, {} as Record<string, number>);
          const breakdown = Object.entries(byOrg).sort((a, b) => b[1] - a[1]);

          return (
            <div
              key={g.status}
              className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
            >
              {/* Panel header */}
              <div
                className={`bg-gradient-to-r ${HGRAD[g.status]} px-4 py-2.5 flex items-center justify-between gap-2`}
              >
                <div className="flex items-center gap-2 shrink-0">
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {STATUS_LABEL[g.status]}
                  </h3>
                  <span className="text-xs font-bold text-white bg-white/30 rounded-full px-2.5 py-0.5">
                    {g.rows.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {breakdown.map(([org, n]) => (
                    <span
                      key={org}
                      className="inline-flex items-center gap-1 min-w-[40px] text-[11px] font-bold text-white bg-white/20 rounded-full px-2 py-0.5 whitespace-nowrap"
                    >
                      <OrgAvatar org={org} />
                      <span className="text-white/90">{n}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Table */}
              <table className="w-full table-fixed border-collapse text-[11px] sm:text-[13px]">
                <colgroup>
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "44%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "15%" }} />
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
                    const mergedAgo = agoLabel(pr.mergedAt);
                    const closedAgo = agoLabel(pr.closedAt);
                    const submittedAgo = agoLabel(`${pr.submittedAt}T00:00:00`);
                    const agoSlot =
                      g.status === "merged"
                        ? mergedAgo
                        : g.status === "closed"
                        ? closedAgo
                        : submittedAgo;
                    const prUrl = pr.url || `https://github.com/${pr.repo}/pull/${pr.number}`;
                    const repoUrl = `https://github.com/${pr.repo}`;
                    const issueMatch = /^#(\d+)$/.exec(pr.issue || "");
                    const issueUrl = issueMatch
                      ? `https://github.com/${pr.repo}/issues/${issueMatch[1]}`
                      : null;

                    return (
                      <tr
                        key={`${pr.repo}-${pr.number}`}
                        className={`border-t border-gray-100 transition-colors ${HOVER[g.status]}`}
                      >
                        {/* Repo */}
                        <td className="pl-3 pr-1 py-2">
                          <a
                            href={repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={pr.repo}
                            className="flex items-center gap-1.5 min-w-0 no-underline hover:underline"
                          >
                            <OrgAvatar org={org} />
                            <span className="truncate text-[#1f2328]">{repoName}</span>
                          </a>
                        </td>

                        {/* Title */}
                        <td className="px-2.5 py-2">
                          <a
                            href={prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`PR #${pr.number}`}
                            className="flex items-center gap-1.5 min-w-0 no-underline group"
                          >
                            {categoryChip(pr.category)}
                            <span className="flex-1 min-w-0 truncate text-[#1f2328] group-hover:text-blue-700 group-hover:underline">
                              {displayTitle}
                            </span>
                            <span className="shrink-0 text-blue-700 align-middle">&#8599;</span>
                          </a>
                        </td>

                        {/* Issue */}
                        <td className="px-1.5 py-2 text-[11px]">
                          {issueUrl ? (
                            <a
                              href={issueUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-700 no-underline hover:underline"
                            >
                              {pr.issue}
                            </a>
                          ) : (
                            <span className="text-gray-500">{pr.issue}</span>
                          )}
                        </td>

                        {/* Submitted */}
                        <td className="px-1.5 py-2 text-gray-500 text-[11px] whitespace-nowrap">
                          {formatDate(pr.submittedAt)}
                        </td>

                        {/* Status + ago */}
                        <td className="pl-1 pr-3 py-2 text-right">
                          {statusPill(g.status, agoSlot)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          PRs &middot; live from GitHub API &middot; localhost:3018 &middot;{" "}
          {mergedCount + closedCount > 0
            ? `${mergedCount} merged / ${mergedCount + closedCount} resolved = ${acceptanceRate}% success`
            : "no resolved PRs yet"}
        </div>
      </div>
    </main>
  );
}
