import Link from "next/link";
import { getAuditReport } from "@/lib/db";
import type { Finding, FileAudited } from "@/lib/db";
import { PR_CATALOG } from "@/lib/prs";

// ─── helpers ──────────────────────────────────────────────────────────────────

function scoreBar(val: number) {
  const pct = (val / 10) * 100;
  const color = val >= 8 ? "#1a7f37" : val >= 6 ? "#b45309" : "#cf222e";
  const bg = val >= 8 ? "#dafbe1" : val >= 6 ? "#fef3c7" : "#ffebe9";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "ui-monospace,monospace" }}>{val}</span>
      <span style={{ width: 44, height: 4, background: "#eaeaea", borderRadius: 99, overflow: "hidden", display: "inline-block" }}>
        <span style={{ display: "block", width: `${pct}%`, height: "100%", background: color, borderRadius: 99 }} />
      </span>
    </span>
  );
}

function confidencePill(c: number) {
  const s = c >= 90 ? { bg: "#dafbe1", color: "#1a7f37", border: "#a7f3d0" }
    : c >= 75 ? { bg: "#fef9c3", color: "#854d0e", border: "#fde68a" }
    : { bg: "#ffebe9", color: "#cf222e", border: "#ffcdd8" };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, fontFamily: "ui-monospace,monospace",
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 4, padding: "1px 6px", letterSpacing: "0.03em"
    }}>{c}%</span>
  );
}

function severityPill(s: string) {
  const isHigh = s === "high" || s === "critical";
  const isMed = s === "medium";
  const style = isHigh ? { bg: "#ffebe9", color: "#cf222e", border: "#ffcdd8" }
    : isMed ? { bg: "#fef9c3", color: "#854d0e", border: "#fde68a" }
    : { bg: "#f6f8fa", color: "#57606a", border: "#d0d7de" };
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, fontFamily: "ui-monospace,monospace",
      textTransform: "uppercase" as const, letterSpacing: "0.08em",
      color: style.color, background: style.bg, border: `1px solid ${style.border}`,
      borderRadius: 3, padding: "2px 5px"
    }}>{s}</span>
  );
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
    <main style={{ minHeight: "100vh", background: "#f6f8fa", color: "#1f2328", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* hero */}
      <div style={{
        background: "linear-gradient(135deg, #fff 0%, #f6f8fa 100%)",
        borderBottom: "1px solid #d0d7de",
        padding: "32px 40px 28px"
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Link href="/prs" style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 12, color: "#57606a", textDecoration: "none",
            marginBottom: 20, fontFamily: "ui-monospace,monospace", letterSpacing: "0.03em"
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 2L4 6l4 4" />
            </svg>
            PR Board
          </Link>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="audit-repo-link" style={{
                  fontSize: 26, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.1
                }}>{fullRepo}</a>
                <a href={prUrl} target="_blank" rel="noopener noreferrer" className="pr-pill">#{prNumber}</a>
              </div>
              {catalogEntry && (
                <div style={{ fontSize: 13, color: "#57606a", fontWeight: 400 }}>{catalogEntry.title}</div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              {audit?.lang && (
                <span style={{ fontSize: 11, color: "#57606a", fontFamily: "ui-monospace,monospace" }}>{audit.lang}</span>
              )}
              {audit?.stars != null && (
                <span style={{ fontSize: 11, color: "#6e7781" }}>&#9733; {audit.stars.toLocaleString()}</span>
              )}
              {audit?.audited_at && (
                <span style={{ fontSize: 10, color: "#8c959f" }}>
                  Audited {new Date(audit.audited_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* body */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 80px" }}>

        {!audit && (
          <div style={{
            background: "#fff", border: "1px solid #d0d7de", borderRadius: 12,
            padding: "48px 24px", textAlign: "center"
          }}>
            <div style={{ fontSize: 13, color: "#57606a", marginBottom: 8 }}>No audit data stored for this PR yet.</div>
            <div style={{ fontSize: 11, color: "#8c959f", fontFamily: "ui-monospace,monospace" }}>
              Run /security-audit {fullRepo}
            </div>
          </div>
        )}

        {audit && (
          <>
            {/* files audited */}
            <Card title="Files Audited" count={audit.files_audited.length} style={{ marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#f6f8fa" }}>
                    {["File", "Role", "Patterns Checked", "Result"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "8px 14px",
                        fontWeight: 600, color: "#57606a", fontSize: 10,
                        letterSpacing: "0.04em", textTransform: "uppercase",
                        borderBottom: "1px solid #d0d7de"
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {audit.files_audited.map((f: FileAudited, i: number) => {
                    const lo = f.result.toLowerCase();
                    const resultColor = lo.includes("clean") || lo.includes("no issue") ? "#1a7f37"
                      : lo.includes("minor") || lo.includes("intended") ? "#57606a"
                      : "#b45309";
                    return (
                      <tr key={i} style={{ borderTop: i > 0 ? "1px solid #f0f0f0" : undefined }}>
                        <td style={{ padding: "10px 14px", fontFamily: "ui-monospace,monospace", fontSize: 10, color: "#24292f", wordBreak: "break-all" }}>{f.path}</td>
                        <td style={{ padding: "10px 14px", color: "#57606a" }}>{f.role}</td>
                        <td style={{ padding: "10px 14px", color: "#6e7781", fontSize: 10 }}>{f.patterns}</td>
                        <td style={{ padding: "10px 14px", color: resultColor, fontWeight: 500 }}>{f.result}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            {/* tournament */}
            {allFindings.length > 0 && (
              <Card title="Tournament Bracket" count={allFindings.length} style={{ marginBottom: 16 }}>
                <div>
                  {allFindings.map((f: Finding, i: number) => {
                    const total = (f.realness || 0) + (f.patchability || 0) + (f.mergability || 0);
                    const isWinner = f.status === "winner";
                    return (
                      <div key={i} style={{
                        padding: "16px 18px",
                        borderTop: i > 0 ? "1px solid #f0f0f0" : undefined,
                        background: isWinner ? "#f0fdf4" : undefined,
                        borderLeft: isWinner ? "3px solid #1a7f37" : undefined,
                      }}>
                        {/* top row */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            {isWinner ? (
                              <span style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                                color: "#1a7f37", background: "#dafbe1", border: "1px solid #a7f3d0",
                                borderRadius: 3, padding: "2px 7px", fontFamily: "ui-monospace,monospace"
                              }}>Winner</span>
                            ) : (
                              <span style={{
                                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                                color: "#8c959f", background: "#f6f8fa", border: "1px solid #d0d7de",
                                borderRadius: 3, padding: "2px 7px", fontFamily: "ui-monospace,monospace"
                              }}>Eliminated</span>
                            )}
                            <span style={{ fontSize: 13, fontWeight: 700, color: isWinner ? "#1f2328" : "#57606a" }}>{f.type}</span>
                            <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 10, color: "#8c959f" }}>{f.file}:{f.line}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {f.severity && severityPill(f.severity)}
                            {f.confidence != null && confidencePill(f.confidence)}
                          </div>
                        </div>

                        {f.code && (
                          <pre style={{
                            fontSize: 11, fontFamily: "ui-monospace,monospace",
                            background: "#f6f8fa", border: "1px solid #d0d7de",
                            borderRadius: 6, padding: "10px 14px",
                            overflowX: "auto", margin: "0 0 10px",
                            color: "#24292f", lineHeight: 1.5, whiteSpace: "pre-wrap"
                          }}>{f.code}</pre>
                        )}

                        {f.fix && (
                          <div style={{ fontSize: 12, color: "#57606a", marginBottom: 12, lineHeight: 1.5 }}>
                            <span style={{ fontWeight: 600, color: "#1f2328" }}>Fix: </span>{f.fix}
                          </div>
                        )}

                        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
                          <div style={{ display: "flex", gap: 16, flex: 1, minWidth: 240, flexWrap: "wrap" }}>
                            {[["Realness", f.realness], ["Patchability", f.patchability], ["Mergability", f.mergability]].map(([label, val]) => (
                              <div key={label as string} style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 80 }}>
                                <span style={{ fontSize: 9, color: "#8c959f", fontFamily: "ui-monospace,monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
                                {scoreBar(val as number || 0)}
                              </div>
                            ))}
                          </div>
                          <span style={{
                            fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em",
                            color: isWinner ? "#1a7f37" : "#d0d7de",
                            fontFamily: "ui-monospace,monospace"
                          }}>{total}<span style={{ fontSize: 11, fontWeight: 500 }}>/30</span></span>
                        </div>

                        {!isWinner && f.eliminated_reason && (
                          <div style={{ marginTop: 8, fontSize: 11, color: "#8c959f", fontStyle: "italic" }}>{f.eliminated_reason}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* winner summary */}
            {audit.winner_summary && (
              <Card title="Why This PR Was Chosen" style={{ marginBottom: 16 }}>
                <div style={{ padding: "16px 18px", fontSize: 13, color: "#24292f", lineHeight: 1.7 }}>
                  {audit.winner_summary}
                </div>
              </Card>
            )}

            {/* pr body */}
            {audit.pr_body && (
              <Card title="PR Body" style={{ marginBottom: 16 }}>
                <pre style={{
                  padding: "16px 18px", fontSize: 12, color: "#57606a",
                  whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0,
                  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
                }}>{audit.pr_body}</pre>
              </Card>
            )}

            {/* talking points */}
            {audit.talking_points.length > 0 && (
              <Card title="Interview Talking Points" count={audit.talking_points.length} style={{ marginBottom: 16 }}>
                <div style={{ padding: "12px 18px" }}>
                  {audit.talking_points.map((pt: string, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderTop: i > 0 ? "1px solid #f6f8fa" : undefined }}>
                      <span style={{
                        flexShrink: 0, width: 20, height: 20, borderRadius: "50%",
                        background: "#dbeafe", color: "#0969da",
                        fontSize: 9, fontWeight: 700, fontFamily: "ui-monospace,monospace",
                        display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: "#57606a", lineHeight: 1.6 }}>{pt}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Card({ title, count, children, style }: {
  title: string; count?: number; children: React.ReactNode; style?: React.CSSProperties
}) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #d0d7de",
      borderRadius: 12, overflow: "hidden", ...style
    }}>
      <div style={{
        padding: "10px 18px", background: "#f6f8fa",
        borderBottom: "1px solid #d0d7de",
        display: "flex", alignItems: "center", gap: 8
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#1f2328", letterSpacing: "0.01em" }}>{title}</span>
        {count != null && (
          <span style={{
            fontSize: 10, fontWeight: 600, color: "#57606a",
            background: "#fff", border: "1px solid #d0d7de",
            borderRadius: 20, padding: "1px 8px"
          }}>{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}
