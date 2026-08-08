import Image from "next/image";
import { fetchLivePRs, PR_CATALOG } from "@/lib/prs";
import type { PRStatus, PRCategory, RepoType } from "@/lib/prs";

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
    case "game": return <svg {...p}><rect x="2" y="6" width="20" height="12" rx="3" /><path d="M6 12h4M8 10v4M15 11h2M15 13h2" /></svg>;
    case "ai": return <svg {...p}><path d="M12 2a4 4 0 014 4v1h1a3 3 0 010 6h-1v1a4 4 0 01-8 0v-1H7a3 3 0 010-6h1V6a4 4 0 014-4z" /><circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" /></svg>;
    case "lib": return <svg {...p}><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>;
    case "app": return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>;
    case "tool": return <svg {...p}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3-3a8 8 0 01-10.7 10.7l-6 6a2.12 2.12 0 01-3-3l6-6A8 8 0 0114.7 6.3z" /></svg>;
    case "api": return <svg {...p}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /><path d="M7 8h2l1 2 2-4 1 2h2" /></svg>;
    default: return null;
  }
}

const CAT_ICON: Record<PRCategory, string> = {
  security: "security", correctness: "correctness", performance: "performance",
  feature: "feature", enhancement: "enhancement",
};

const TYPE_CLS: Record<RepoType, string> = {
  game: "bg-purple-50 text-purple-700 border border-purple-200",
  ai:   "bg-orange-50 text-orange-700 border border-orange-200",
  lib:  "bg-sky-50 text-sky-700 border border-sky-200",
  app:  "bg-teal-50 text-teal-700 border border-teal-200",
  tool: "bg-slate-100 text-slate-600 border border-slate-200",
  api:  "bg-indigo-50 text-indigo-700 border border-indigo-200",
};

const TYPE_ICON_CLS: Record<RepoType, string> = {
  game: "text-purple-400", ai: "text-orange-400", lib: "text-sky-400",
  app: "text-teal-400", tool: "text-slate-400", api: "text-indigo-400",
};

const TYPE_LABEL: Record<RepoType, string> = {
  game: "Game", ai: "AI", lib: "Library", app: "App", tool: "Tool", api: "API",
};

function repoTypeChip(t?: RepoType) {
  if (!t) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 whitespace-nowrap ${TYPE_CLS[t]}`}>
      <Icon name={t} className="w-2.5 h-2.5 shrink-0" />
      {TYPE_LABEL[t]}
    </span>
  );
}

function categoryChip(cat?: PRCategory) {
  if (!cat) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[8.5px] font-bold uppercase tracking-wide rounded px-1 py-0.5 whitespace-nowrap ${CAT_CLS[cat]}`}>
      <Icon name={CAT_ICON[cat]} className="w-2 h-2 shrink-0" />
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
  const days = Math.floor(ms / 86400000);
  return days === 0 ? "today" : `${days}d ago`;
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


// ─── page ─────────────────────────────────────────────────────────────────────

export default async function PRsBoard() {
  const prs = await fetchLivePRs();

  // ── PR counts ──
  const counts: Record<PRStatus, number> = { open: 0, merged: 0, draft: 0, closed: 0 };
  for (const pr of prs) counts[pr.liveStatus ?? "open"]++;

  const catOrder: PRCategory[] = ["security", "correctness", "performance", "feature", "enhancement"];
  const total = prs.length;
  const mergedCount = counts.merged;
  const closedCount = counts.closed;

  const byNewest = (a: { submittedAt: string; number: number }, b: { submittedAt: string; number: number }) =>
    b.submittedAt.localeCompare(a.submittedAt) || b.number - a.number;
  const groups = GROUP_ORDER.map((status) => ({
    status, rows: prs.filter((pr) => (pr.liveStatus ?? "open") === status).sort(byNewest),
  })).filter((g) => g.rows.length > 0);

  // ── daily activity chart ──
  const today = new Date().toISOString().slice(0, 10);
  const dailyCounts = PR_CATALOG.reduce((m, pr) => {
    m[pr.submittedAt] = (m[pr.submittedAt] || 0) + 1;
    return m;
  }, {} as Record<string, number>);
  const chartDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const date = d.toISOString().slice(0, 10);
    return { date, count: dailyCounts[date] || 0 };
  });
  const openToday  = dailyCounts[today] || 0;
  const mergedToday = prs.filter(p => p.mergedAt?.startsWith(today)).length;
  const closedToday = prs.filter(p => p.liveStatus === "closed" && p.closedAt?.startsWith(today)).length;
  const chartMax = Math.max(...chartDays.map(d => d.count), 1);
  const CW = 400, CH = 44;
  const chartPad = 3;
  const chartPts = chartDays.map((d, i) => ({
    x: (i / (chartDays.length - 1)) * (CW - chartPad * 2) + chartPad,
    y: CH - chartPad - (d.count / chartMax) * (CH - chartPad * 2),
  }));
  const linePath = chartPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${chartPts[chartPts.length - 1].x.toFixed(1)},${CH} L${chartPts[0].x.toFixed(1)},${CH} Z`;
  const todayPt = chartPts[chartPts.length - 1];

  return (
    <main className="min-h-screen bg-[#f6f8fa] text-[#1f2328]"
      style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div className="max-w-[1100px] mx-auto px-5 py-7 pb-16">

        {/* ── Header ── */}
        <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="AI GitHub Bot" width={52} height={52} className="rounded-xl shrink-0" unoptimized />
            <div>
              <h1 className="text-3xl font-bold text-[#1f2328] leading-none">AI GitHub</h1>
              <div className="text-[13px] text-gray-500 mt-1">
                {total} PRs submitted &middot; {mergedCount} merged
              </div>
            </div>
          </div>
        </div>

        {/* ── Hero: Open / Merged / Closed today ── */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {([
            { grad: "from-blue-600 to-blue-800",     icon: "open",   val: counts.open,   label: "Open",     sub: openToday > 0   ? `+${openToday} today`   : "" },
            { grad: "from-green-600 to-emerald-700", icon: "merged", val: mergedCount,   label: "Merged",   sub: mergedToday > 0 ? `+${mergedToday} today`  : "" },
            { grad: "from-rose-500 to-rose-700",     icon: "closed", val: closedCount,   label: "Rejected", sub: closedToday > 0 ? `+${closedToday} today`  : "" },
          ] as const).map((t) => (
            <div key={t.label} className={`rounded-[10px] px-3 py-3 text-white shadow-sm bg-gradient-to-br ${t.grad} flex items-stretch gap-2`}>
              <div className="flex-1 min-w-0">
                <div className="text-[28px] font-bold leading-none">{t.val}</div>
                <div className="text-[10px] text-white/80 mt-0.5">{t.label}</div>
              </div>
              <div className="w-[72px] shrink-0 flex flex-col justify-between">
                <svg viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none" className="w-full" style={{ height: 32, display: "block" }}>
                  <path d={areaPath} fill="rgba(255,255,255,0.12)" />
                  <path d={linePath} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                {t.sub && <div className="text-[8px] text-white/60 text-right leading-none mt-0.5">{t.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* ══ SECTION: PR BOARD ══ */}
        <div className="flex items-center gap-2 mb-3">
          <Icon name="pipeline" className="w-4 h-4 text-gray-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">PR Board</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {groups.map((g) => {
          const catBreakdown = catOrder
            .map(c => ({ c, n: g.rows.filter(pr => pr.category === c).length }))
            .filter(x => x.n > 0);

          return (
            <div key={g.status} className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className={`bg-gradient-to-r ${HGRAD[g.status]} px-4 py-2.5 flex items-center gap-3`}>
                <div className="flex items-center gap-2 shrink-0">
                  <h3 className="text-sm font-bold text-white tracking-wide">{STATUS_LABEL[g.status]}</h3>
                  <span className="text-xs font-bold text-white bg-white/30 rounded-full px-2.5 py-0.5">{g.rows.length}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  {catBreakdown.map(({ c, n }) => (
                    <span key={c} className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-white/85 bg-white/15 rounded-full px-2 py-0.5 whitespace-nowrap">
                      <Icon name={CAT_ICON[c]} className="w-2.5 h-2.5" />
                      {CAT_LABEL[c]} {n}
                    </span>
                  ))}
                </div>
              </div>
              <table className="w-full table-fixed border-collapse text-[11px]">
                <colgroup>
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "42%" }} />
                  <col style={{ width: "23%" }} />
                  <col style={{ width: "18%" }} />
                </colgroup>
                <thead>
                  <tr className="bg-[#f6f8fa] text-gray-400 text-[11px] text-left">
                    <th className="pl-3 pr-2 py-2 font-medium align-top">Repo</th>
                    <th className="px-2.5 py-2 font-medium align-top">Title</th>
                    <th className="px-2 py-2 font-medium align-top">Issue</th>
                    <th className="pl-2 pr-3 py-2 font-medium align-top">PR</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((pr) => {
                    const [org, repoName] = (pr.repo || "/").split("/");
                    const displayTitle = pr.liveTitle || pr.title;
                    const dateSlot = g.status === "merged" ? agoLabel(pr.mergedAt)
                      : g.status === "closed" ? agoLabel(pr.closedAt)
                      : formatDate(pr.submittedAt);
                    const prUrl = pr.url || `https://github.com/${pr.repo}/pull/${pr.number}`;
                    const issueMatch = /^#(\d+)$/.exec(pr.issue || "");
                    const issueUrl = issueMatch ? `https://github.com/${pr.repo}/issues/${issueMatch[1]}` : null;
                    const rt = pr.repoType ?? "app";
                    return (
                      <tr key={`${pr.repo}-${pr.number}`} className={`border-t border-gray-100 transition-colors ${HOVER[g.status]}`}>
                        <td className="pl-3 pr-2 py-2 overflow-hidden align-top">
                          <a href={`https://github.com/${pr.repo}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 min-w-0 no-underline hover:underline">
                            <OrgAvatar org={org} />
                            <span className="truncate text-[#1f2328] text-[11px]">{repoName}</span>
                          </a>
                        </td>
                        <td className="px-2.5 py-2 overflow-hidden align-top">
                          <a href={prUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 min-w-0 no-underline group">
                            <Icon name={rt} className={`w-3 h-3 shrink-0 mr-0.5 ${TYPE_ICON_CLS[rt]}`} />
                            <span className="flex-1 min-w-0 truncate text-[#1f2328] group-hover:text-blue-700 group-hover:underline">{displayTitle}</span>
                            <span className="shrink-0 text-blue-700 text-[10px]">&#8599;</span>
                          </a>
                        </td>
                        <td className="px-2 py-2 overflow-hidden align-top">
                          <div className="flex items-start gap-1.5 min-w-0 flex-wrap">
                            {issueUrl
                              ? <a href={issueUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 no-underline hover:underline text-[10px] font-mono shrink-0 whitespace-nowrap">{pr.issue}</a>
                              : <span className="text-gray-400 text-[10px] whitespace-nowrap shrink-0">{pr.issue}</span>}
                            {categoryChip(pr.category)}
                          </div>
                        </td>
                        <td className="pl-2 pr-3 py-2 overflow-hidden align-top">
                          <div className="flex items-start gap-1.5 min-w-0 flex-wrap whitespace-nowrap">
                            <a href={prUrl} target="_blank" rel="noopener noreferrer"
                              className="text-blue-700 no-underline hover:underline font-mono text-[11px] shrink-0">
                              #{pr.number}
                            </a>
                            {g.status !== "open" && (
                              <span className={`text-[8px] font-bold uppercase tracking-wide rounded px-1 py-0.5 shrink-0 ${PILL_CLS[g.status]}`}>
                                {STATUS_LABEL[g.status]}
                              </span>
                            )}
                            {dateSlot && <span className="text-[9px] text-gray-400 shrink-0">{dateSlot}</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* ── Footer ── */}
        <div className="mt-8 text-center text-xs text-gray-400">
          {total} submitted &middot; {mergedCount} merged &middot; live from GitHub API &middot; localhost:3018
          {closedCount > 0 && ` · ${closedCount} rejected`}
        </div>
      </div>
    </main>
  );
}
