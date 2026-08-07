import Image from "next/image";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fetchLivePRs, PR_CATALOG } from "@/lib/prs";
import type { PRStatus, PRCategory } from "@/lib/prs";
import OpportunityActions from "../discover/Actions";

export const dynamic = "force-dynamic";

// ─── styling maps ─────────────────────────────────────────────────────────────

const CAT_CLS: Record<PRCategory, string> = {
  security: "bg-red-50 text-red-700 border border-red-200",
  correctness: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  performance: "bg-amber-50 text-amber-700 border border-amber-200",
  feature: "bg-teal-50 text-teal-700 border border-teal-200",
  enhancement: "bg-gray-100 text-gray-600 border border-gray-200",
};
const CAT_LABEL: Record<PRCategory, string> = {
  security: "Security", correctness: "Correctness", performance: "Performance",
  feature: "Feature", enhancement: "Enhancement",
};
const CAT_GRAD: Record<PRCategory, string> = {
  security: "from-red-600 to-rose-800", correctness: "from-indigo-500 to-indigo-700",
  performance: "from-amber-500 to-orange-600", feature: "from-teal-500 to-teal-700",
  enhancement: "from-gray-500 to-gray-700",
};
const HGRAD: Record<PRStatus, string> = {
  open: "from-blue-600 to-blue-800", merged: "from-green-600 to-emerald-700",
  draft: "from-gray-400 to-gray-600", closed: "from-rose-500 to-rose-700",
};
const HOVER: Record<PRStatus, string> = {
  open: "hover:bg-blue-50", merged: "hover:bg-green-50",
  draft: "hover:bg-gray-50", closed: "hover:bg-rose-50",
};
const PILL_CLS: Record<PRStatus, string> = {
  open: "bg-blue-50 text-blue-700 border border-blue-200",
  merged: "bg-green-50 text-green-700 border border-green-200",
  draft: "bg-gray-100 text-gray-500",
  closed: "bg-red-50 text-red-600 border border-red-200",
};
const STATUS_LABEL: Record<PRStatus, string> = {
  open: "Open", merged: "Merged", draft: "Draft", closed: "Closed",
};
const GROUP_ORDER: PRStatus[] = ["open", "merged", "draft", "closed"];

const TYPE_PILL: Record<string, string> = {
  bug_fix: "bg-red-50 text-red-700 border border-red-200",
  security: "bg-red-50 text-red-700 border border-red-200",
  docs: "bg-sky-50 text-sky-700 border border-sky-200",
  performance: "bg-orange-50 text-orange-700 border border-orange-200",
  feature: "bg-indigo-50 text-indigo-700 border border-indigo-200",
};
const EFFORT_PILL: Record<string, string> = {
  low: "bg-green-50 text-green-700 border border-green-200",
  medium: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  high: "bg-red-50 text-red-600 border border-red-200",
};

// ─── icons ────────────────────────────────────────────────────────────────────

function Icon({ name, className = "" }: { name: string; className?: string }) {
  const p = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className };
  switch (name) {
    case "security": return <svg {...p}><path d="M12 2l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V5l8-3z" /></svg>;
    case "correctness": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></svg>;
    case "performance": return <svg {...p}><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></svg>;
    case "feature": return <svg {...p}><path d="M12 2l2.4 6.3L21 11l-6.6 2.7L12 20l-2.4-6.3L3 11l6.6-2.7z" /></svg>;
    case "enhancement": return <svg {...p}><path d="M3 21l7-7M13 4l7 7M14 3l3-1 2 2-1 3M9 8l7 7" /></svg>;
    case "total": return <svg {...p}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></svg>;
    case "open": return <svg {...p}><circle cx="7" cy="6" r="2.3" /><circle cx="7" cy="18" r="2.3" /><path d="M7 8.3v7.4M17 8v8" /><circle cx="17" cy="6" r="2.3" /></svg>;
    case "merged": return <svg {...p}><circle cx="7" cy="6" r="2.3" /><circle cx="7" cy="18" r="2.3" /><path d="M7 8.3v7.4" /><circle cx="17" cy="8" r="2.3" /><path d="M17 10.3c0 4-4 4.5-7 5.4" /></svg>;
    case "closed": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg>;
    case "draft": return <svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2 2 0 013 3L7 19l-4 1 1-4z" /></svg>;
    case "rate": return <svg {...p}><path d="M12 2l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V5l8-3z" /><path d="M9 12l2 2 4-4" /></svg>;
    case "pipeline": return <svg {...p}><path d="M3 6h18M3 12h18M3 18h18" /></svg>;
    case "telescope": return <svg {...p}><path d="M10 10L4.5 5.5M18.5 2.5l-14 14M14 14l5.5 5.5M7 17l3-3" /><circle cx="10" cy="10" r="3" /></svg>;
    default: return null;
  }
}

const CAT_ICON: Record<PRCategory, string> = {
  security: "security", correctness: "correctness", performance: "performance",
  feature: "feature", enhancement: "enhancement",
};

function categoryChip(cat?: PRCategory) {
  if (!cat) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 whitespace-nowrap ${CAT_CLS[cat]}`}>
      <Icon name={CAT_ICON[cat]} className="w-2.5 h-2.5 shrink-0" />
      {CAT_LABEL[cat]}
    </span>
  );
}

// ─── org avatar ───────────────────────────────────────────────────────────────

const GRAD_COLORS = ["#0969da", "#8250df", "#bf3989", "#1a7f37", "#9a6700", "#1b9aaa"];

function OrgAvatar({ org }: { org: string }) {
  const init = (org || "?").slice(0, 1).toUpperCase();
  const bg = GRAD_COLORS[[...org].reduce((a, c) => a + c.charCodeAt(0), 0) % GRAD_COLORS.length];
  return (
    <span className="relative inline-flex items-center justify-center rounded-[5px] align-middle text-white text-[12px] font-bold shrink-0 overflow-hidden"
      style={{ width: 20, height: 20, background: bg }}>
      {init}
      <Image src={`https://github.com/${org}.png?size=40`} alt={org} width={20} height={20}
        unoptimized className="absolute inset-0 h-full w-full object-cover" />
    </span>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function agoLabel(d?: string | null): string {
  if (!d) return "";
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return "";
  const ms = Date.now() - t;
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hrs = Math.floor(ms / 3600000);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function formatDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function statusPill(status: PRStatus, agoSlot?: string) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 text-center ${PILL_CLS[status]}`}
        style={{ width: 52, display: "inline-block" }}>{STATUS_LABEL[status]}</span>
      <span className="text-[10px] text-gray-400" style={{ width: 46, display: "inline-block" }}>{agoSlot ?? ""}</span>
    </span>
  );
}

function confColor(c: number) {
  if (c >= 75) return "text-green-600";
  if (c >= 50) return "text-yellow-600";
  return "text-gray-400";
}

function timeAgo(iso: string): string {
  if (!iso) return "never";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── pipeline data ────────────────────────────────────────────────────────────

interface Opportunity {
  id: string; repo: string; issue_number: number; issue_title: string; issue_url: string;
  opportunity_type: string; effort: string; confidence: number; why: string;
  status: "opportunity" | "skipped" | "pr_submitted"; found_at: string; age_days: number;
  is_favorite: boolean; cambodia_community?: boolean;
}

interface PipelineState {
  last_scan: string; favorites: string[];
  submitted_prs: Record<string, unknown>[];
  opportunities: Opportunity[];
}

function loadPipeline(): PipelineState | null {
  const file = join(process.cwd(), "data/pipeline.json");
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8"));
}

// Normalize submitted_prs - backfill missing title/issue/date from PR_CATALOG
function normalizePRs(raw: Record<string, unknown>[]) {
  return raw.map((p) => {
    const prNum = (p.pr_number ?? p.pr) as number;
    if (!p.title && prNum) {
      const cat = PR_CATALOG.find((c) => c.repo === p.repo && c.number === prNum);
      if (cat) return { repo: cat.repo, pr_number: cat.number, issue: cat.issue, title: cat.title, submitted_at: cat.submittedAt };
    }
    return { repo: p.repo as string, pr_number: prNum, issue: (p.issue ?? "") as string, title: (p.title ?? "") as string, submitted_at: ((p.submitted_at ?? p.submittedAt ?? "") as string) };
  });
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function PRsBoard() {
  const [prs, pipeline] = await Promise.all([fetchLivePRs(), Promise.resolve(loadPipeline())]);

  // ── PR counts ──
  const counts: Record<PRStatus, number> = { open: 0, merged: 0, draft: 0, closed: 0 };
  for (const pr of prs) counts[pr.liveStatus ?? "open"]++;

  const catCounts = prs.reduce((m, pr) => {
    if (pr.category) m[pr.category] = (m[pr.category] || 0) + 1;
    return m;
  }, {} as Record<PRCategory, number>);
  const catOrder: PRCategory[] = ["security", "correctness", "performance", "feature", "enhancement"];

  const total = prs.length;
  const mergedCount = counts.merged;
  const closedCount = counts.closed;
  const acceptanceRate = mergedCount + closedCount > 0 ? Math.round((mergedCount / (mergedCount + closedCount)) * 100) : 0;

  const lastMergedAgo = (() => {
    const dates = prs.filter(p => p.mergedAt).map(p => new Date(p.mergedAt!).getTime()).filter(Boolean);
    return dates.length ? agoLabel(new Date(Math.max(...dates)).toISOString()) : "";
  })();
  const lastRejectedAgo = (() => {
    const dates = prs.filter(p => p.liveStatus === "closed" && p.closedAt).map(p => new Date(p.closedAt!).getTime()).filter(Boolean);
    return dates.length ? agoLabel(new Date(Math.max(...dates)).toISOString()) : "";
  })();

  const byNewest = (a: { submittedAt: string; number: number }, b: { submittedAt: string; number: number }) =>
    b.submittedAt.localeCompare(a.submittedAt) || b.number - a.number;
  const groups = GROUP_ORDER.map((status) => ({
    status, rows: prs.filter((pr) => (pr.liveStatus ?? "open") === status).sort(byNewest),
  })).filter((g) => g.rows.length > 0);

  // ── pipeline ──
  const openOpps = (pipeline?.opportunities ?? []).filter(o => o.status === "opportunity");
  const highConf = openOpps.filter(o => o.confidence >= 70);
  const favOpps = openOpps.filter(o => o.is_favorite || (pipeline?.favorites ?? []).includes(o.repo));
  const submittedPRs = normalizePRs(pipeline?.submitted_prs ?? []);

  return (
    <main className="min-h-screen bg-[#f6f8fa] text-[#1f2328]"
      style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div className="max-w-[960px] mx-auto px-5 py-7 pb-16">

        {/* ── Header ── */}
        <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-[#1f2328]">AI GitHub</h1>
            </div>
            <div className="text-[13px] text-gray-500">
              {total} PRs out &middot; {openOpps.length} opportunities &middot;{" "}
              {pipeline?.last_scan ? `last scan ${timeAgo(pipeline.last_scan)}` : "not yet scanned"}
            </div>
          </div>
          {pipeline && <OpportunityActions action="scan" label="Scan Now" />}
        </div>

        {/* ── Status hero tiles ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
          <div className="relative rounded-[10px] px-3 py-3 text-white shadow-sm bg-gradient-to-br from-gray-700 to-gray-900">
            <Icon name="total" className="w-3.5 h-3.5 absolute top-2 right-2 text-white/40" />
            <div className="text-[24px] font-bold leading-none">{total}</div>
            <div className="text-[10px] text-white/80 mt-0.5">Total PRs</div>
          </div>
          <div className="relative rounded-[10px] px-3 py-3 text-white shadow-sm bg-gradient-to-br from-blue-600 to-blue-800">
            <Icon name="open" className="w-3.5 h-3.5 absolute top-2 right-2 text-white/40" />
            <div className="text-[24px] font-bold leading-none">{counts.open}</div>
            <div className="text-[10px] text-white/80 mt-0.5">Open</div>
          </div>
          <div className="relative rounded-[10px] px-3 py-3 text-white shadow-sm bg-gradient-to-br from-green-600 to-emerald-700">
            <Icon name="merged" className="w-3.5 h-3.5 absolute top-2 right-2 text-white/40" />
            <div className="text-[24px] font-bold leading-none">{counts.merged}</div>
            <div className="text-[10px] text-white/80 mt-0.5">Merged</div>
            {lastMergedAgo && <div className="text-[9px] text-white/60 mt-0.5">{lastMergedAgo}</div>}
          </div>
          <div className="relative rounded-[10px] px-3 py-3 text-white shadow-sm bg-gradient-to-br from-rose-500 to-rose-700">
            <Icon name="closed" className="w-3.5 h-3.5 absolute top-2 right-2 text-white/40" />
            <div className="text-[24px] font-bold leading-none">{counts.closed}</div>
            <div className="text-[10px] text-white/80 mt-0.5">Rejected</div>
            {lastRejectedAgo && <div className="text-[9px] text-white/60 mt-0.5">{lastRejectedAgo}</div>}
          </div>
          <div className="relative rounded-[10px] px-3 py-3 text-white shadow-sm bg-gradient-to-br from-gray-400 to-gray-600">
            <Icon name="draft" className="w-3.5 h-3.5 absolute top-2 right-2 text-white/40" />
            <div className="text-[24px] font-bold leading-none">{counts.draft}</div>
            <div className="text-[10px] text-white/80 mt-0.5">Draft</div>
          </div>
          <div className="relative rounded-[10px] px-3 py-3 text-white shadow-sm bg-gradient-to-br from-violet-600 to-purple-800">
            <Icon name="rate" className="w-3.5 h-3.5 absolute top-2 right-2 text-white/40" />
            <div className="text-[24px] font-bold leading-none">{mergedCount + closedCount > 0 ? `${acceptanceRate}%` : "-"}</div>
            <div className="text-[10px] text-white/80 mt-0.5">Accepted</div>
          </div>
        </div>

        {/* ── Category mini-tiles ── */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          {catOrder.map((c) => (
            <div key={c} className={`relative rounded-[10px] px-2.5 py-2 text-white shadow-sm bg-gradient-to-br ${CAT_GRAD[c]}`}>
              <Icon name={CAT_ICON[c]} className="w-3 h-3 absolute top-1.5 right-1.5 text-white/40" />
              <div className="text-[20px] font-bold leading-none">{catCounts[c] || 0}</div>
              <div className="text-[9px] text-white/80 mt-0.5 truncate">{CAT_LABEL[c]}</div>
            </div>
          ))}
        </div>

        {/* ── Pipeline stat tiles ── */}
        {pipeline && (
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 mb-6">
            <div className="relative rounded-[10px] px-3 py-2.5 text-white shadow-sm bg-gradient-to-br from-blue-500 to-blue-700">
              <Icon name="telescope" className="w-3.5 h-3.5 absolute top-2 right-2 text-white/40" />
              <div className="text-[20px] font-bold leading-none">{openOpps.length}</div>
              <div className="text-[10px] text-white/80 mt-0.5">Opportunities</div>
            </div>
            <div className="relative rounded-[10px] px-3 py-2.5 text-white shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-700">
              <Icon name="rate" className="w-3.5 h-3.5 absolute top-2 right-2 text-white/40" />
              <div className="text-[20px] font-bold leading-none">{highConf.length}</div>
              <div className="text-[10px] text-white/80 mt-0.5">High Conf</div>
            </div>
            <div className="relative rounded-[10px] px-3 py-2.5 text-white shadow-sm bg-gradient-to-br from-amber-500 to-orange-600">
              <Icon name="feature" className="w-3.5 h-3.5 absolute top-2 right-2 text-white/40" />
              <div className="text-[20px] font-bold leading-none">{favOpps.length}</div>
              <div className="text-[10px] text-white/80 mt-0.5">Favorites</div>
            </div>
          </div>
        )}

        {/* ══ SECTION: PR BOARD ══ */}
        <div className="flex items-center gap-2 mb-3">
          <Icon name="pipeline" className="w-4 h-4 text-gray-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">PR Board</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {groups.map((g) => {
          const byOrg = g.rows.reduce((m, r) => {
            const org = (r.repo || "/").split("/")[0];
            m[org] = (m[org] || 0) + 1;
            return m;
          }, {} as Record<string, number>);
          const breakdown = Object.entries(byOrg).sort((a, b) => b[1] - a[1]);

          return (
            <div key={g.status} className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className={`bg-gradient-to-r ${HGRAD[g.status]} px-4 py-2.5 flex items-center justify-between gap-2`}>
                <div className="flex items-center gap-2 shrink-0">
                  <h3 className="text-sm font-bold text-white tracking-wide">{STATUS_LABEL[g.status]}</h3>
                  <span className="text-xs font-bold text-white bg-white/30 rounded-full px-2.5 py-0.5">{g.rows.length}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {breakdown.map(([org, n]) => (
                    <span key={org} className="inline-flex items-center gap-1 min-w-[40px] text-[11px] font-bold text-white bg-white/20 rounded-full px-2 py-0.5 whitespace-nowrap">
                      <OrgAvatar org={org} />
                      <span className="text-white/90">{n}</span>
                    </span>
                  ))}
                </div>
              </div>
              <table className="w-full table-fixed border-collapse text-[11px] sm:text-[13px]">
                <colgroup>
                  <col style={{ width: "20%" }} /><col style={{ width: "44%" }} />
                  <col style={{ width: "10%" }} /><col style={{ width: "11%" }} /><col style={{ width: "15%" }} />
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
                    const agoSlot = g.status === "merged" ? agoLabel(pr.mergedAt)
                      : g.status === "closed" ? agoLabel(pr.closedAt)
                      : agoLabel(`${pr.submittedAt}T00:00:00`);
                    const prUrl = pr.url || `https://github.com/${pr.repo}/pull/${pr.number}`;
                    const issueMatch = /^#(\d+)$/.exec(pr.issue || "");
                    const issueUrl = issueMatch ? `https://github.com/${pr.repo}/issues/${issueMatch[1]}` : null;
                    return (
                      <tr key={`${pr.repo}-${pr.number}`} className={`border-t border-gray-100 transition-colors ${HOVER[g.status]}`}>
                        <td className="pl-3 pr-1 py-2">
                          <a href={`https://github.com/${pr.repo}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 min-w-0 no-underline hover:underline">
                            <OrgAvatar org={org} />
                            <span className="truncate text-[#1f2328]">{repoName}</span>
                          </a>
                        </td>
                        <td className="px-2.5 py-2">
                          <a href={prUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 min-w-0 no-underline group">
                            {categoryChip(pr.category)}
                            <span className="flex-1 min-w-0 truncate text-[#1f2328] group-hover:text-blue-700 group-hover:underline">{displayTitle}</span>
                            <span className="shrink-0 text-blue-700">&#8599;</span>
                          </a>
                        </td>
                        <td className="px-1.5 py-2 text-[11px]">
                          {issueUrl ? <a href={issueUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 no-underline hover:underline">{pr.issue}</a>
                            : <span className="text-gray-500">{pr.issue}</span>}
                        </td>
                        <td className="px-1.5 py-2 text-gray-500 text-[11px] whitespace-nowrap">{formatDate(pr.submittedAt)}</td>
                        <td className="pl-1 pr-3 py-2 text-right">{statusPill(g.status, agoSlot)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* ══ SECTION: PIPELINE ══ */}
        {pipeline && openOpps.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-10 mb-3">
              <Icon name="telescope" className="w-4 h-4 text-gray-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Pipeline</span>
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] text-gray-400">{openOpps.length} open</span>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">Opportunities</h3>
                  <span className="text-xs font-bold text-white bg-white/30 rounded-full px-2.5 py-0.5">{openOpps.length}</span>
                  <span className="text-xs text-white/70 bg-white/10 rounded-full px-2 py-0.5">{highConf.length} high conf</span>
                </div>
                <OpportunityActions action="scan" label="Scan" />
              </div>
              <table className="w-full table-fixed border-collapse text-[11px] sm:text-[12px]">
                <colgroup>
                  <col style={{ width: "3%" }} /><col style={{ width: "18%" }} />
                  <col style={{ width: "6%" }} /><col style={{ width: "30%" }} />
                  <col style={{ width: "8%" }} /><col style={{ width: "7%" }} />
                  <col style={{ width: "6%" }} /><col style={{ width: "6%" }} />
                  <col style={{ width: "16%" }} />
                </colgroup>
                <thead>
                  <tr className="bg-[#f6f8fa] text-gray-400 text-[11px] text-left">
                    <th className="pl-2 py-2"></th>
                    <th className="px-2 py-2 font-medium">Repo</th>
                    <th className="px-2 py-2 font-medium">Issue</th>
                    <th className="px-2 py-2 font-medium">Title</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Effort</th>
                    <th className="px-2 py-2 font-medium">Conf</th>
                    <th className="px-2 py-2 font-medium">Age</th>
                    <th className="px-2 pr-3 py-2 font-medium">Why</th>
                  </tr>
                </thead>
                <tbody>
                  {openOpps.slice(0, 50).map((opp) => {
                    const [org, repoName] = opp.repo.split("/");
                    return (
                      <tr key={opp.id} className="border-t border-gray-100 hover:bg-blue-50 transition-colors">
                        <td className="pl-2 py-2">
                          <OpportunityActions action="favorite" oppId={opp.id} repo={opp.repo}
                            isFav={opp.is_favorite || (pipeline.favorites ?? []).includes(opp.repo)} />
                        </td>
                        <td className="px-2 py-2 truncate">
                          <a href={`https://github.com/${opp.repo}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 min-w-0 no-underline hover:underline">
                            <OrgAvatar org={org} />
                            <span className="truncate text-[#1f2328] font-medium">{repoName}</span>
                          </a>
                        </td>
                        <td className="px-2 py-2">
                          <a href={opp.issue_url} target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 hover:underline">#{opp.issue_number}</a>
                        </td>
                        <td className="px-2 py-2 truncate text-[#1f2328]" title={opp.issue_title}>{opp.issue_title}</td>
                        <td className="px-2 py-2">
                          <span className={`text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${TYPE_PILL[opp.opportunity_type] || "bg-gray-100 text-gray-500"}`}>
                            {opp.opportunity_type.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <span className={`text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${EFFORT_PILL[opp.effort] || "bg-gray-100 text-gray-500"}`}>
                            {opp.effort}
                          </span>
                        </td>
                        <td className={`px-2 py-2 font-bold ${confColor(opp.confidence)}`}>{opp.confidence}%</td>
                        <td className="px-2 py-2 text-gray-500 whitespace-nowrap">{opp.age_days}d</td>
                        <td className="px-2 pr-3 py-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="flex-1 min-w-0 truncate text-gray-500 text-[10px]" title={opp.why}>{opp.why}</span>
                            <OpportunityActions action="skip" oppId={opp.id} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Footer ── */}
        <div className="mt-8 text-center text-xs text-gray-400">
          {total} PRs &middot; {openOpps.length} opportunities &middot; live from GitHub API &middot; localhost:3018
          {mergedCount + closedCount > 0 && ` &middot; ${mergedCount}/${mergedCount + closedCount} resolved = ${acceptanceRate}%`}
        </div>
      </div>
    </main>
  );
}
