import Image from "next/image";
import Link from "next/link";
import { getAuditReport } from "@/lib/db";
import type { Finding, FileAudited, TechStackEntry } from "@/lib/db";
import { PR_CATALOG } from "@/lib/prs";

// ─── lang -> Simple Icons slug ────────────────────────────────────────────────

const LANG_SLUG: Record<string, { slug: string; url: string }> = {
  Go:         { slug: "go",         url: "https://go.dev" },
  Python:     { slug: "python",     url: "https://python.org" },
  TypeScript: { slug: "typescript", url: "https://typescriptlang.org" },
  JavaScript: { slug: "javascript", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" },
  Rust:       { slug: "rust",       url: "https://rust-lang.org" },
  Java:       { slug: "java",       url: "https://java.com" },
  Ruby:       { slug: "ruby",       url: "https://ruby-lang.org" },
  PHP:        { slug: "php",        url: "https://php.net" },
  "C++":      { slug: "cplusplus",  url: "https://isocpp.org" },
  "C#":       { slug: "csharp",     url: "https://dotnet.microsoft.com" },
  Swift:      { slug: "swift",      url: "https://swift.org" },
  Kotlin:     { slug: "kotlin",     url: "https://kotlinlang.org" },
  Dart:       { slug: "dart",       url: "https://dart.dev" },
  Elixir:     { slug: "elixir",     url: "https://elixir-lang.org" },
  Haskell:    { slug: "haskell",    url: "https://haskell.org" },
  C:          { slug: "c",          url: "https://en.wikipedia.org/wiki/C_(programming_language)" },
  Scala:      { slug: "scala",      url: "https://scala-lang.org" },
  Shell:      { slug: "gnubash",    url: "https://gnu.org/software/bash/" },
  Dockerfile: { slug: "docker",     url: "https://docker.com" },
};

// ─── fetch PR author + repo info from GitHub API ──────────────────────────────

async function fetchGitHubPRMeta(owner: string, repo: string, prNumber: number) {
  const headers = { "User-Agent": "ai-security-audit/1.0", Accept: "application/vnd.github+json" };
  try {
    const [prRes, repoRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, { headers, next: { revalidate: 3600 } }),
      fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers, next: { revalidate: 3600 } }),
    ]);
    const pr = prRes.ok ? await prRes.json() : null;
    const repoData = repoRes.ok ? await repoRes.json() : null;
    return {
      authorLogin: pr?.user?.login as string | null ?? null,
      authorAvatar: pr?.user?.avatar_url as string | null ?? null,
      authorUrl: pr?.user?.html_url as string | null ?? null,
      repoDescription: repoData?.description as string | null ?? null,
      repoStars: repoData?.stargazers_count as number | null ?? null,
      repoLang: repoData?.language as string | null ?? null,
      repoForks: repoData?.forks_count as number | null ?? null,
    };
  } catch { return null; }
}

// ─── fetch tech stack from GitHub API ─────────────────────────────────────────

async function fetchGitHubTechStack(owner: string, repo: string): Promise<TechStackEntry[]> {
  const headers: Record<string, string> = { "User-Agent": "ai-security-audit/1.0", Accept: "application/vnd.github+json" };

  // 1. Languages breakdown
  let langBytes: Record<string, number> = {};
  try {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers, next: { revalidate: 86400 } });
    if (r.ok) langBytes = await r.json();
  } catch {}

  const total = Object.values(langBytes).reduce((a, b) => a + b, 0) || 1;
  const stack: TechStackEntry[] = Object.entries(langBytes)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, bytes]) => ({
      name: lang,
      slug: LANG_SLUG[lang]?.slug,
      url: LANG_SLUG[lang]?.url,
      category: "Language",
      version: `${Math.round((bytes / total) * 100)}%`,
    }));

  // 2. Try to get runtime/framework version from manifest
  const tryFetch = async (path: string) => {
    try {
      const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers, next: { revalidate: 86400 } });
      if (!r.ok) return null;
      const j = await r.json();
      return Buffer.from(j.content, "base64").toString("utf8");
    } catch { return null; }
  };

  const primaryLang = Object.keys(langBytes)[0] ?? "";

  if (primaryLang === "Go") {
    const gomod = await tryFetch("go.mod");
    if (gomod) {
      const m = gomod.match(/^go\s+([\d.]+)/m);
      if (m) {
        const entry = stack.find(e => e.name === "Go");
        if (entry) { entry.version = `go ${m[1]} (${entry.version})`; }
        stack.unshift({ name: "Go", slug: "go", url: "https://go.dev", category: "Runtime", version: `go ${m[1]}` });
        // deduplicate
        const seen = new Set<string>();
        return stack.filter(e => { const k = e.name + e.category; if (seen.has(k)) return false; seen.add(k); return true; });
      }
    }
  }

  if (primaryLang === "Python") {
    const pyproj = await tryFetch("pyproject.toml");
    if (pyproj) {
      const m = pyproj.match(/python_requires\s*=\s*["']([^"']+)["']/);
      if (m) {
        const entry = stack.find(e => e.name === "Python");
        if (entry) entry.version = `${m[1]} (${entry.version})`;
      }
    }
  }

  if (primaryLang === "TypeScript" || primaryLang === "JavaScript") {
    const pkg = await tryFetch("package.json");
    if (pkg) {
      try {
        const j = JSON.parse(pkg);
        const nodeVer = j.engines?.node ?? j.volta?.node ?? null;
        if (nodeVer) stack.push({ name: "Node.js", slug: "nodedotjs", url: "https://nodejs.org", category: "Runtime", version: nodeVer });
        const frameworks: Array<[string, string, string, string]> = [
          ["next",    "nextdotjs",   "https://nextjs.org",     "Framework"],
          ["react",   "react",       "https://react.dev",      "Framework"],
          ["vue",     "vuedotjs",    "https://vuejs.org",      "Framework"],
          ["express", "express",     "https://expressjs.com",  "Framework"],
          ["fastify", "fastify",     "https://fastify.dev",    "Framework"],
        ];
        for (const [pkg2, slug, url, cat] of frameworks) {
          const ver = j.dependencies?.[pkg2] ?? j.devDependencies?.[pkg2];
          if (ver) stack.push({ name: pkg2.charAt(0).toUpperCase() + pkg2.slice(1), slug, url, category: cat, version: ver });
        }
      } catch {}
    }
  }

  return stack.slice(0, 10);
}

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
  const techStackPromise = audit?.tech_stack?.length
    ? Promise.resolve(audit.tech_stack)
    : fetchGitHubTechStack(owner, repoName);
  const [techStack, prMeta] = await Promise.all([techStackPromise, fetchGitHubPRMeta(owner, repoName, prNumber)]);

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

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Repo owner avatar */}
            <Image
              src={`https://github.com/${owner}.png?size=80`}
              alt={owner} width={48} height={48} unoptimized
              style={{ borderRadius: 10, border: "2px solid #d0d7de", display: "block", flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* row 1: repo name + PR pill */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="audit-repo-link" style={{
                  fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.2
                }}>{fullRepo}</a>
                <a href={prUrl} target="_blank" rel="noopener noreferrer" className="pr-pill">#{prNumber}</a>
              </div>
              {/* row 2: PR title */}
              {catalogEntry && (
                <div style={{ fontSize: 12, color: "#57606a", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{catalogEntry.title}</div>
              )}
              {/* row 3: stats + author inline */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {(prMeta?.repoStars ?? audit?.stars) != null && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#fff8c5", border: "1px solid #e3b341", borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 600, color: "#9a6700" }}>
                    &#9733; {(prMeta?.repoStars ?? audit?.stars ?? 0).toLocaleString()}
                  </span>
                )}
                {prMeta?.repoForks != null && prMeta.repoForks > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#f6f8fa", border: "1px solid #d0d7de", borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 600, color: "#57606a" }}>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="#57606a"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
                    {prMeta.repoForks.toLocaleString()}
                  </span>
                )}
                {(prMeta?.repoLang ?? audit?.lang) && (
                  <span style={{ fontSize: 10, color: "#57606a", fontFamily: "ui-monospace,monospace", background: "#f6f8fa", border: "1px solid #d0d7de", borderRadius: 6, padding: "2px 7px" }}>
                    {prMeta?.repoLang ?? audit?.lang}
                  </span>
                )}
                {audit?.audited_at && (
                  <span style={{ fontSize: 10, color: "#8c959f" }}>
                    Audited {new Date(audit.audited_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
                {prMeta?.authorLogin && (
                  <a href={prMeta.authorUrl ?? `https://github.com/${prMeta.authorLogin}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none",
                      background: "#fff", border: "1px solid #d0d7de", borderRadius: 20, padding: "2px 8px 2px 3px" }}>
                    <Image src={prMeta.authorAvatar ?? `https://github.com/${prMeta.authorLogin}.png?size=28`}
                      alt={prMeta.authorLogin} width={16} height={16} unoptimized
                      style={{ borderRadius: "50%", display: "block" }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#1f2328" }}>@{prMeta.authorLogin}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* body */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 80px" }}>

        {/* tech stack */}
        {techStack.length > 0 && (
          <Card title="Tech Stack" count={techStack.length} color="blue" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "14px 18px" }}>
              {techStack.map((t: TechStackEntry, i: number) => (
                <a key={i} href={t.url ?? "#"} target="_blank" rel="noopener noreferrer"
                  style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 7,
                    background: "#f6f8fa", border: "1px solid #d0d7de", borderRadius: 8,
                    padding: "6px 11px", transition: "border-color 0.15s" }}
                  className="tech-chip">
                  {t.slug ? (
                    <img src={`https://cdn.simpleicons.org/${t.slug}`} width={14} height={14} alt={t.name}
                      style={{ flexShrink: 0, objectFit: "contain" }} />
                  ) : (
                    <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#d0d7de",
                      fontSize: 8, fontWeight: 700, color: "#57606a", display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {t.name[0]}
                    </span>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1f2328" }}>{t.name}</span>
                  {t.version && (
                    <span style={{ fontSize: 10, color: "#57606a", fontFamily: "ui-monospace,monospace",
                      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 4, padding: "1px 5px" }}>
                      {t.version}
                    </span>
                  )}
                  {t.category && (
                    <span style={{ fontSize: 9, color: "#8c959f", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t.category}</span>
                  )}
                </a>
              ))}
            </div>
          </Card>
        )}

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
            {audit.files_audited.length > 0 && (<Card title="Files Audited" count={audit.files_audited.length} color="purple" style={{ marginBottom: 16 }}>
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
            </Card>)}

            {/* tournament */}
            {allFindings.length > 0 && (
              <Card title="Tournament Bracket" count={allFindings.length} color="amber" style={{ marginBottom: 16 }}>
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
              <Card title="Why This PR Was Chosen" color="green" style={{ marginBottom: 16 }}>
                <div style={{ padding: "16px 18px", fontSize: 13, color: "#24292f", lineHeight: 1.7 }}>
                  {audit.winner_summary}
                </div>
              </Card>
            )}

            {/* pr body */}
            {audit.pr_body && (
              <Card title="PR Body" color="teal" style={{ marginBottom: 16 }}>
                <pre style={{
                  padding: "16px 18px", fontSize: 12, color: "#57606a",
                  whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0,
                  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
                }}>{audit.pr_body}</pre>
              </Card>
            )}

            {/* talking points */}
            {audit.talking_points.length > 0 && (
              <Card title="Interview Talking Points" count={audit.talking_points.length} color="indigo" style={{ marginBottom: 16 }}>
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

const CARD_COLORS: Record<string, { bg: string; countColor: string }> = {
  blue:   { bg: "linear-gradient(135deg,#3b82f6,#1d4ed8)", countColor: "#1d4ed8" },
  purple: { bg: "linear-gradient(135deg,#a78bfa,#7c3aed)", countColor: "#7c3aed" },
  amber:  { bg: "linear-gradient(135deg,#f59e0b,#b45309)", countColor: "#b45309" },
  green:  { bg: "linear-gradient(135deg,#22c55e,#15803d)", countColor: "#15803d" },
  teal:   { bg: "linear-gradient(135deg,#2dd4bf,#0f766e)", countColor: "#0f766e" },
  indigo: { bg: "linear-gradient(135deg,#818cf8,#4338ca)", countColor: "#4338ca" },
  gray:   { bg: "linear-gradient(135deg,#9ca3af,#57606a)", countColor: "#57606a" },
};

function Card({ title, count, children, style, color = "gray" }: {
  title: string; count?: number; children: React.ReactNode;
  style?: React.CSSProperties; color?: keyof typeof CARD_COLORS;
}) {
  const c = CARD_COLORS[color] ?? CARD_COLORS.gray;
  return (
    <div style={{
      background: "#fff", border: "1px solid #d0d7de",
      borderRadius: 12, overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style
    }}>
      <div style={{
        padding: "11px 18px", background: c.bg,
        display: "flex", alignItems: "center", gap: 8
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.01em" }}>{title}</span>
        {count != null && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: c.countColor,
            background: "rgba(255,255,255,0.92)",
            borderRadius: 20, padding: "1px 9px"
          }}>{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}
