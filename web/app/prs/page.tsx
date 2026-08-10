import Image from "next/image";
import Link from "next/link";
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

  const STATUS_COLOR: Record<PRStatus, { bg: string; border: string; text: string; num: string; sub: string }> = {
    open:   { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", num: "#1d4ed8", sub: "#3b82f6" },
    merged: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", num: "#15803d", sub: "#22c55e" },
    closed: { bg: "#fff1f2", border: "#fecdd3", text: "#be123c", num: "#be123c", sub: "#f43f5e" },
    draft:  { bg: "#f9fafb", border: "#e5e7eb", text: "#374151", num: "#374151", sub: "#9ca3af" },
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f6f8fa", color: "#1f2328", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* ── Hero ── */}
      <div style={{ background: "linear-gradient(135deg,#fff 0%,#f6f8fa 100%)", borderBottom: "1px solid #d0d7de", padding: "32px 40px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <Image src="/logo.png" alt="AI GitHub Bot" width={44} height={44} style={{ borderRadius: 10 }} unoptimized />
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.1, color: "#1f2328" }}>AI GitHub</h1>
              <div style={{ fontSize: 12, color: "#57606a", marginTop: 3 }}>{total} PRs submitted &middot; {mergedCount} merged</div>
            </div>
          </div>

          {/* stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {([
              { status: "open"   as PRStatus, val: counts.open,  label: "Open",     sub: openToday   > 0 ? `+${openToday} today`   : "" },
              { status: "merged" as PRStatus, val: mergedCount,  label: "Merged",   sub: mergedToday > 0 ? `+${mergedToday} today`  : "" },
              { status: "closed" as PRStatus, val: closedCount,  label: "Rejected", sub: closedToday > 0 ? `+${closedToday} today`  : "" },
            ]).map(t => {
              const sc = STATUS_COLOR[t.status];
              return (
                <div key={t.label} style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: sc.num, lineHeight: 1 }}>{t.val}</div>
                    <div style={{ fontSize: 11, color: sc.text, marginTop: 4, fontWeight: 600, letterSpacing: "0.03em" }}>{t.label}</div>
                    {t.sub && <div style={{ fontSize: 10, color: sc.sub, marginTop: 2 }}>{t.sub}</div>}
                  </div>
                  <svg viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none" style={{ width: 80, height: 36, flexShrink: 0, opacity: 0.5 }}>
                    <path d={areaPath} fill={sc.border} />
                    <path d={linePath} fill="none" stroke={sc.text} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    <circle cx={todayPt.x} cy={todayPt.y} r="3" fill={sc.text} />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Board ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 80px" }}>

        {groups.map((g) => {
          const sc = STATUS_COLOR[g.status];
          const catBreakdown = catOrder
            .map(c => ({ c, n: g.rows.filter(pr => pr.category === c).length }))
            .filter(x => x.n > 0);

          return (
            <div key={g.status} style={{ background: "#fff", border: `1px solid ${sc.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 16, boxShadow: `0 1px 3px ${sc.border}40` }}>
              {/* group header */}
              <div style={{ padding: "10px 18px", background: sc.bg, borderBottom: `1px solid ${sc.border}`, display: "flex", alignItems: "center", gap: 10, borderLeft: `4px solid ${sc.text}` }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: sc.text, letterSpacing: "0.01em" }}>{STATUS_LABEL[g.status]}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: sc.text, background: "#fff", border: `1px solid ${sc.border}`, borderRadius: 20, padding: "1px 8px" }}>{g.rows.length}</span>
                <span style={{ fontSize: 10, color: sc.text, opacity: 0.7 }}>
                  {catBreakdown.map(({ c, n }) => `${CAT_LABEL[c]} ${n}`).join(" · ")}
                </span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "42%" }} />
                  <col style={{ width: "23%" }} />
                  <col style={{ width: "18%" }} />
                </colgroup>
                <thead>
                  <tr style={{ background: "#f6f8fa" }}>
                    {["Repo","Title","Issue","PR"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "7px 14px", fontWeight: 600, color: "#57606a", fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "1px solid #d0d7de" }}>{h}</th>
                    ))}
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
                      <tr key={`${pr.repo}-${pr.number}`} style={{ borderTop: "1px solid #f0f0f0" }} className={`transition-colors ${HOVER[g.status]}`}>
                        <td style={{ padding: "9px 14px", overflow: "hidden" }}>
                          <a href={`https://github.com/${pr.repo}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 min-w-0 no-underline hover:underline">
                            <OrgAvatar org={org} />
                            <span className="truncate" style={{ color: "#1f2328", fontSize: 11 }}>{repoName}</span>
                          </a>
                        </td>
                        <td style={{ padding: "9px 14px", overflow: "hidden" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                            <div className="flex items-center gap-1 min-w-0">
                              <Icon name={rt} className={`w-3 h-3 shrink-0 mr-0.5 ${TYPE_ICON_CLS[rt]}`} />
                              <Link href={`/prs/${org}/${repoName}/${pr.number}`}
                                className="flex-1 min-w-0 truncate hover:text-blue-700 hover:underline no-underline"
                                style={{ color: "#1f2328", fontSize: 11 }}>
                                {displayTitle}
                              </Link>
                              <a href={prUrl} target="_blank" rel="noopener noreferrer"
                                style={{ color: "#0969da", fontSize: 10, flexShrink: 0, marginLeft: 2 }}>&#8599;</a>
                            </div>
                            {pr.category && (
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                {categoryChip(pr.category)}
                                {issueUrl
                                  ? <a href={issueUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#8c959f", fontSize: 9, fontFamily: "ui-monospace,monospace", textDecoration: "none" }}>{pr.issue}</a>
                                  : pr.issue ? <span style={{ color: "#8c959f", fontSize: 9, fontFamily: "ui-monospace,monospace" }}>{pr.issue}</span> : null}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "9px 14px", overflow: "hidden" }}>
                          {!pr.category && (issueUrl
                            ? <a href={issueUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0969da", fontSize: 10, fontFamily: "ui-monospace,monospace", whiteSpace: "nowrap" }}>{pr.issue}</a>
                            : <span style={{ color: "#8c959f", fontSize: 10, whiteSpace: "nowrap" }}>{pr.issue}</span>)}
                        </td>
                        <td style={{ padding: "9px 14px", overflow: "hidden" }}>
                          <div className="flex flex-col items-start gap-0.5">
                            <a href={prUrl} target="_blank" rel="noopener noreferrer"
                              style={{ color: "#0969da", fontFamily: "ui-monospace,monospace", fontSize: 11 }}>
                              #{pr.number}
                            </a>
                            {dateSlot && <span style={{ fontSize: 9, color: "#8c959f" }}>{dateSlot}</span>}
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

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "#8c959f" }}>
          {total} submitted &middot; {mergedCount} merged &middot; live from GitHub API
          {closedCount > 0 && ` · ${closedCount} rejected`}
        </div>
      </div>
    </main>
  );
}
