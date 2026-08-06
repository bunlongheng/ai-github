import { readFileSync, existsSync } from "fs";
import { join } from "path";
import OpportunityActions from "./Actions";

export const dynamic = "force-dynamic";

interface Opportunity {
  id: string;
  repo: string;
  issue_number: number;
  issue_title: string;
  issue_url: string;
  opportunity_type: string;
  effort: string;
  confidence: number;
  activity_score: number;
  why: string;
  status: "opportunity" | "skipped" | "pr_submitted";
  found_at: string;
  age_days: number;
  is_favorite: boolean;
  cambodia_community?: boolean;
  cambodia_why?: string;
}

interface CambodiaRepo {
  full_name: string;
  stars: number;
  owner: string;
  why: string;
}

interface State {
  last_scan: string;
  favorites: string[];
  repos_checked: Record<string, { last_checked: string; vitality: number; status?: string }>;
  submitted_prs: { repo: string; pr_number: number; issue: string; title: string; submitted_at: string; status: string }[];
  opportunities: Opportunity[];
  cambodia_repos?: CambodiaRepo[];
  cambodia_last_scan?: string;
}

function loadState(): State {
  const file = join(process.cwd(), "data/pipeline.json");
  if (!existsSync(file)) {
    return { last_scan: "", favorites: [], repos_checked: {}, submitted_prs: [], opportunities: [] };
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

function timeAgo(iso: string): string {
  if (!iso) return "never";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_PILL: Record<string, string> = {
  bug_fix: "bg-red-50 text-red-700 border border-red-200",
  docs: "bg-sky-50 text-sky-700 border border-sky-200",
  tests: "bg-purple-50 text-purple-700 border border-purple-200",
  performance: "bg-orange-50 text-orange-700 border border-orange-200",
  feature: "bg-indigo-50 text-indigo-700 border border-indigo-200",
};

const EFFORT_PILL: Record<string, string> = {
  low: "bg-green-50 text-green-700 border border-green-200",
  medium: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  high: "bg-red-50 text-red-600 border border-red-200",
};

const STATUS_PILL: Record<string, string> = {
  opportunity: "bg-blue-50 text-blue-700 border border-blue-200",
  skipped: "bg-gray-100 text-gray-400",
  pr_submitted: "bg-green-50 text-green-700 border border-green-200",
};

function confColor(c: number): string {
  if (c >= 75) return "text-green-600";
  if (c >= 50) return "text-yellow-600";
  return "text-gray-400";
}

export default function DiscoverPage() {
  const state = loadState();
  const all = state.opportunities;
  const open = all.filter((o) => o.status === "opportunity");
  const submitted = state.submitted_prs;
  const reposChecked = Object.keys(state.repos_checked).length;
  const favs = state.favorites;

  const highConf = open.filter((o) => o.confidence >= 70);
  const cambodiaOpps = open.filter((o) => o.cambodia_community);
  const cambodiaRepos = state.cambodia_repos || [];

  const summaryTiles = [
    { label: "Opportunities", count: open.length, grad: "from-blue-600 to-blue-800" },
    { label: "High Conf", count: highConf.length, grad: "from-green-600 to-emerald-700" },
    { label: "KH Community", count: cambodiaRepos.length, grad: "from-red-500 to-red-700" },
    { label: "Favorites", count: favs.length, grad: "from-purple-600 to-purple-800" },
    { label: "PRs Out", count: submitted.length, grad: "from-gray-600 to-gray-800" },
  ];

  return (
    <main
      className="min-h-screen bg-[#f6f8fa] text-[#1f2328]"
      style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}
    >
      <div className="max-w-[1100px] mx-auto px-5 py-7 pb-16">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-[#1f2328]">Discover</h1>
              <a
                href="/prs"
                className="text-[13px] text-blue-600 hover:underline"
              >
                View PRs &rarr;
              </a>
            </div>
            <div className="text-[13px] text-gray-500">
              Last scan: {timeAgo(state.last_scan)} &middot; {reposChecked} repos watched &middot; favorites run first
            </div>
          </div>
          <OpportunityActions action="scan" label="Scan Now" />
        </div>

        {/* Summary tiles */}
        <div className="flex flex-wrap gap-2 mb-6">
          {summaryTiles.map((t) => (
            <div
              key={t.label}
              className={`flex-1 min-w-[88px] rounded-[10px] px-2.5 py-2.5 sm:px-4 sm:py-3 text-white shadow-sm bg-gradient-to-r ${t.grad}`}
            >
              <div className="text-[20px] sm:text-[26px] font-bold leading-none">{t.count}</div>
              <div className="text-[10px] sm:text-xs text-white/85 mt-0.5 truncate">{t.label}</div>
            </div>
          ))}
        </div>

        {/* Submitted PRs panel */}
        {submitted.length > 0 && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-4 py-2.5 flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">PRs Submitted</h3>
              <span className="text-xs font-bold text-white bg-white/30 rounded-full px-2.5 py-0.5">
                {submitted.length}
              </span>
            </div>
            <table className="w-full table-fixed border-collapse text-[12px]">
              <colgroup>
                <col style={{ width: "28%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "42%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr className="bg-[#f6f8fa] text-gray-400 text-[11px] text-left">
                  <th className="pl-3 py-2 font-medium">Repo</th>
                  <th className="px-2 py-2 font-medium">Issue</th>
                  <th className="px-2 py-2 font-medium">Title</th>
                  <th className="px-2 py-2 font-medium">Date</th>
                  <th className="pr-3 py-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {submitted.map((pr) => (
                  <tr key={`${pr.repo}-${pr.pr_number}`} className="border-t border-gray-100">
                    <td className="pl-3 py-2 text-[#1f2328] truncate">{pr.repo.split("/")[1]}</td>
                    <td className="px-2 py-2 text-gray-500">{pr.issue}</td>
                    <td className="px-2 py-2 truncate text-[#1f2328]">{pr.title}</td>
                    <td className="px-2 py-2 text-gray-500 whitespace-nowrap">{pr.submitted_at}</td>
                    <td className="pr-3 py-2 text-right">
                      <span className={`text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${STATUS_PILL[pr.status] || STATUS_PILL.opportunity}`}>
                        {pr.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cambodia community radar panel */}
        {cambodiaRepos.length > 0 && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-700 px-4 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Cambodian Community Radar</h3>
                <span className="text-xs font-bold text-white bg-white/30 rounded-full px-2.5 py-0.5">
                  {cambodiaRepos.length} repos
                </span>
                {cambodiaOpps.length > 0 && (
                  <span className="text-xs font-bold text-white bg-white/20 rounded-full px-2.5 py-0.5">
                    {cambodiaOpps.length} open opps
                  </span>
                )}
              </div>
              {state.cambodia_last_scan && (
                <span className="text-[11px] text-white/70">
                  updated {timeAgo(state.cambodia_last_scan)}
                </span>
              )}
            </div>
            <table className="w-full table-fixed border-collapse text-[12px]">
              <colgroup>
                <col style={{ width: "32%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "60%" }} />
              </colgroup>
              <thead>
                <tr className="bg-[#f6f8fa] text-gray-400 text-[11px] text-left">
                  <th className="pl-3 py-2 font-medium">Repo</th>
                  <th className="px-2 py-2 font-medium">Stars</th>
                  <th className="px-2 pr-3 py-2 font-medium">Why Cambodia</th>
                </tr>
              </thead>
              <tbody>
                {cambodiaRepos.map((r) => (
                  <tr key={r.full_name} className="border-t border-gray-100 hover:bg-red-50 transition-colors">
                    <td className="pl-3 py-2">
                      <a
                        href={`https://github.com/${r.full_name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {r.full_name}
                      </a>
                    </td>
                    <td className="px-2 py-2 text-gray-600 font-bold">{r.stars}</td>
                    <td className="px-2 pr-3 py-2 text-gray-500 text-[11px] truncate" title={r.why}>
                      {r.why}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Opportunities panel */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-2.5 flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-wide">Opportunities</h3>
            <span className="text-xs font-bold text-white bg-white/30 rounded-full px-2.5 py-0.5">
              {open.length}
            </span>
            {open.length === 0 && (
              <span className="text-xs text-white/70 ml-2">Run &ldquo;Scan Now&rdquo; to find opportunities</span>
            )}
          </div>

          {all.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              No opportunities yet. Click &ldquo;Scan Now&rdquo; to discover repos and issues.
            </div>
          ) : (
            <table className="w-full table-fixed border-collapse text-[11px] sm:text-[12px]">
              <colgroup>
                <col style={{ width: "3%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "27%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "18%" }} />
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
                {all.map((opp) => (
                  <tr
                    key={opp.id}
                    className={`border-t border-gray-100 hover:bg-blue-50 transition-colors ${opp.status === "skipped" ? "opacity-40" : ""}`}
                  >
                    {/* Fav star */}
                    <td className="pl-2 py-2">
                      <OpportunityActions
                        action="favorite"
                        oppId={opp.id}
                        repo={opp.repo}
                        isFav={opp.is_favorite || state.favorites.includes(opp.repo)}
                      />
                    </td>

                    {/* Repo */}
                    <td className="px-2 py-2 truncate font-medium text-[#1f2328]">
                      {opp.repo.split("/")[1]}
                      <span className="text-gray-400 font-normal ml-0.5 text-[10px]">
                        /{opp.repo.split("/")[0]}
                      </span>
                      {opp.cambodia_community && (
                        <span className="ml-1 text-[9px] font-bold uppercase tracking-wide rounded px-1 py-0.5 bg-red-50 text-red-600 border border-red-200" title={opp.cambodia_why}>KH</span>
                      )}
                    </td>

                    {/* Issue */}
                    <td className="px-2 py-2">
                      <a
                        href={opp.issue_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        #{opp.issue_number}
                      </a>
                    </td>

                    {/* Title */}
                    <td className="px-2 py-2 truncate text-[#1f2328]" title={opp.issue_title}>
                      {opp.issue_title}
                    </td>

                    {/* Type */}
                    <td className="px-2 py-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${TYPE_PILL[opp.opportunity_type] || "bg-gray-100 text-gray-500"}`}>
                        {opp.opportunity_type.replace("_", " ")}
                      </span>
                    </td>

                    {/* Effort */}
                    <td className="px-2 py-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${EFFORT_PILL[opp.effort] || "bg-gray-100 text-gray-500"}`}>
                        {opp.effort}
                      </span>
                    </td>

                    {/* Confidence */}
                    <td className={`px-2 py-2 font-bold ${confColor(opp.confidence)}`}>
                      {opp.confidence}%
                    </td>

                    {/* Age */}
                    <td className="px-2 py-2 text-gray-500 whitespace-nowrap">
                      {opp.age_days}d
                    </td>

                    {/* Why + actions */}
                    <td className="px-2 pr-3 py-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="flex-1 min-w-0 truncate text-gray-500 text-[10px]" title={opp.why}>
                          {opp.why}
                        </span>
                        {opp.status === "opportunity" && (
                          <OpportunityActions action="skip" oppId={opp.id} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Discover &middot; hourly scan &middot; localhost:3018 &middot;{" "}
          {open.length} open &middot; {state.submitted_prs.length} submitted
        </div>
      </div>
    </main>
  );
}
