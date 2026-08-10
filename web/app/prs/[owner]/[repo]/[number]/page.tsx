import Link from "next/link";
import { getAuditReport } from "@/lib/db";
import type { Finding, FileAudited } from "@/lib/db";
import { notFound } from "next/navigation";
import { PR_CATALOG } from "@/lib/prs";

// ─── helpers ──────────────────────────────────────────────────────────────────

function scoreBar(val: number) {
  const pct = (val / 10) * 100;
  const color = val >= 8 ? "#22c55e" : val >= 6 ? "#f59e0b" : "#ef4444";
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-[11px] font-bold" style={{ color }}>{val}</span>
      <span className="block rounded-full overflow-hidden" style={{ width: 40, height: 5, background: "#e5e7eb" }}>
        <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </span>
    </span>
  );
}

function confidencePill(c: number) {
  const cls = c >= 90 ? "bg-green-50 text-green-700 border border-green-200"
    : c >= 75 ? "bg-amber-50 text-amber-700 border border-amber-200"
    : "bg-red-50 text-red-600 border border-red-200";
  return <span className={`text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${cls}`}>{c}%</span>;
}

function severityPill(s: string) {
  const cls = s === "high" || s === "critical" ? "bg-red-50 text-red-700 border border-red-200"
    : s === "medium" ? "bg-amber-50 text-amber-700 border border-amber-200"
    : "bg-gray-100 text-gray-600";
  return <span className={`text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${cls}`}>{s}</span>;
}

// ─── page ─────────────────────────────────────────────────────────────────────

type Params = { owner: string; repo: string; number: string };

export default async function AuditDetailPage({ params }: { params: Promise<Params> }) {
  const { owner, repo: repoName, number } = await params;
  const fullRepo = `${owner}/${repoName}`;
  const prNumber = parseInt(number, 10);

  const catalogEntry = PR_CATALOG.find(p => p.repo === fullRepo && p.number === prNumber);
  const audit = getAuditReport(fullRepo, prNumber);

  const prUrl = `https://github.com/${fullRepo}/pull/${prNumber}`;
  const repoUrl = `https://github.com/${fullRepo}`;

  const winners = audit?.findings.filter(f => f.status === "winner") ?? [];
  const eliminated = audit?.findings.filter(f => f.status === "eliminated") ?? [];
  const allFindings = [...winners, ...eliminated];

  return (
    <main className="min-h-screen bg-[#f6f8fa] text-[#1f2328]"
      style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div className="max-w-[900px] mx-auto px-5 py-6 pb-16">

        {/* back */}
        <Link href="/prs" className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-blue-700 mb-5 no-underline">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path d="M10 3L5 8l5 5" />
          </svg>
          PR Board
        </Link>

        {/* header */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 mb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <a href={repoUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[20px] font-bold text-[#1f2328] hover:text-blue-700 no-underline">{fullRepo}</a>
                <span className="text-gray-300">·</span>
                <a href={prUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[14px] font-mono text-blue-700 hover:underline no-underline">#{prNumber}</a>
              </div>
              {catalogEntry && (
                <div className="text-[12px] text-gray-500">{catalogEntry.title}</div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {audit?.lang && <span className="text-[11px] text-gray-500">{audit.lang}</span>}
              {audit?.stars != null && (
                <span className="text-[11px] text-gray-400">&#9733; {audit.stars.toLocaleString()}</span>
              )}
              {audit?.audited_at && (
                <span className="text-[10px] text-gray-400">
                  Audited {new Date(audit.audited_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* no audit data fallback */}
        {!audit && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-8 text-center">
            <div className="text-gray-400 text-[13px] mb-2">No audit data stored for this PR yet.</div>
            <div className="text-gray-300 text-[11px]">Run <code className="font-mono">/security-audit {fullRepo}</code> to generate a full audit report.</div>
          </div>
        )}

        {audit && (
          <>
            {/* files audited */}
            <Section title="Files Audited" count={audit.files_audited.length}>
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-[#f6f8fa] text-gray-400 text-left">
                    <th className="px-3 py-2 font-medium" style={{ width: "30%" }}>File</th>
                    <th className="px-3 py-2 font-medium" style={{ width: "20%" }}>Role</th>
                    <th className="px-3 py-2 font-medium" style={{ width: "25%" }}>Patterns Checked</th>
                    <th className="px-3 py-2 font-medium" style={{ width: "25%" }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.files_audited.map((f: FileAudited, i: number) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-mono text-[10px] text-[#1f2328] break-all">{f.path}</td>
                      <td className="px-3 py-2 text-gray-600">{f.role}</td>
                      <td className="px-3 py-2 text-gray-500">{f.patterns}</td>
                      <td className="px-3 py-2">
                        <span className={f.result.toLowerCase().includes("clean") || f.result.toLowerCase().includes("no issue")
                          ? "text-green-600" : "text-amber-600"}>{f.result}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            {/* tournament bracket */}
            {allFindings.length > 0 && (
              <Section title="Tournament Bracket" count={allFindings.length}>
                <div className="divide-y divide-gray-100">
                  {allFindings.map((f: Finding, i: number) => (
                    <div key={i} className={`px-4 py-3 ${f.status === "winner" ? "bg-green-50/50" : ""}`}>
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {f.status === "winner"
                            ? <span className="text-[9px] font-bold uppercase tracking-wide bg-green-600 text-white rounded px-1.5 py-0.5">Winner</span>
                            : <span className="text-[9px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">Eliminated</span>}
                          <span className="text-[12px] font-semibold text-[#1f2328]">{f.type}</span>
                          <span className="font-mono text-[10px] text-gray-500">{f.file}:{f.line}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {f.severity && severityPill(f.severity)}
                          {f.confidence != null && confidencePill(f.confidence)}
                        </div>
                      </div>

                      {f.code && (
                        <pre className="text-[10px] rounded px-3 py-2 mb-2 overflow-x-auto"
                          style={{ background: "#f6f8fa", border: "1px solid #e5e7eb", fontFamily: "ui-monospace,monospace" }}>
                          {f.code}
                        </pre>
                      )}

                      {f.fix && (
                        <div className="text-[11px] text-gray-600 mb-2">
                          <span className="font-semibold text-gray-700">Fix: </span>{f.fix}
                        </div>
                      )}

                      <div className="flex items-center gap-4 flex-wrap">
                        <ScoreTrio r={f.realness} p={f.patchability} m={f.mergability} />
                        {f.status === "eliminated" && f.eliminated_reason && (
                          <span className="text-[10px] text-gray-400 italic">{f.eliminated_reason}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* winner summary */}
            {audit.winner_summary && (
              <Section title="Why This PR Was Chosen">
                <div className="px-4 py-3 text-[12px] text-gray-700 leading-relaxed">{audit.winner_summary}</div>
              </Section>
            )}

            {/* PR body */}
            {audit.pr_body && (
              <Section title="PR Body">
                <div className="px-4 py-3">
                  <pre className="text-[11px] text-gray-700 whitespace-pre-wrap leading-relaxed"
                    style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
                    {audit.pr_body}
                  </pre>
                </div>
              </Section>
            )}

            {/* talking points */}
            {audit.talking_points.length > 0 && (
              <Section title="Interview Talking Points" count={audit.talking_points.length}>
                <ul className="px-4 py-3 space-y-2">
                  {audit.talking_points.map((pt: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                      <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
      <div className="px-4 py-2.5 bg-[#f6f8fa] border-b border-gray-200 flex items-center gap-2">
        <span className="text-[12px] font-bold text-[#1f2328]">{title}</span>
        {count != null && (
          <span className="text-[10px] font-bold bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function ScoreTrio({ r, p, m }: { r: number; p: number; m: number }) {
  const total = (r || 0) + (p || 0) + (m || 0);
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-[10px] text-gray-400">Realness {scoreBar(r || 0)}</span>
      <span className="text-[10px] text-gray-400">Patchability {scoreBar(p || 0)}</span>
      <span className="text-[10px] text-gray-400">Mergability {scoreBar(m || 0)}</span>
      <span className="text-[10px] font-bold text-gray-600">Total {total}/30</span>
    </div>
  );
}
