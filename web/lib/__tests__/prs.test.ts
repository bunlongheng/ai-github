import { describe, it, expect, vi, beforeEach } from "vitest";
import { PR_CATALOG, fetchLivePRs } from "../prs";

describe("PR_CATALOG", () => {
  it("has at least one PR", () => {
    expect(PR_CATALOG.length).toBeGreaterThan(0);
  });

  it("every catalog entry has required fields", () => {
    for (const pr of PR_CATALOG) {
      expect(pr.number).toBeGreaterThan(0);
      expect(pr.repo).toMatch(/\w+\/\w+/);
      expect(pr.issue).toMatch(/^#\d+$/);
      expect(pr.submittedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("fetchLivePRs", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("maps merged_at -> 'merged'", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ merged_at: "2026-08-05T00:00:00Z", draft: false, state: "closed", title: "fix: test", html_url: "https://github.com/x/y/pull/1" }),
    }));
    const prs = await fetchLivePRs();
    expect(prs[0].liveStatus).toBe("merged");
  });

  it("maps draft:true -> 'draft'", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ merged_at: null, draft: true, state: "open", title: "draft pr", html_url: "https://github.com/x/y/pull/1" }),
    }));
    const prs = await fetchLivePRs();
    expect(prs[0].liveStatus).toBe("draft");
  });

  it("maps state:closed + no merged_at -> 'closed'", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ merged_at: null, draft: false, state: "closed", title: "rejected", html_url: "https://github.com/x/y/pull/1" }),
    }));
    const prs = await fetchLivePRs();
    expect(prs[0].liveStatus).toBe("closed");
  });

  it("falls back to 'open' on HTTP error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const prs = await fetchLivePRs();
    expect(prs[0].liveStatus).toBe("open");
  });

  it("falls back to 'open' on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    const prs = await fetchLivePRs();
    expect(prs[0].liveStatus).toBe("open");
  });

  it("fetches all PRs in parallel", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ merged_at: null, draft: false, state: "open", title: "t", html_url: "https://github.com/x/y/pull/1" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await fetchLivePRs();
    expect(fetchMock).toHaveBeenCalledTimes(PR_CATALOG.length);
  });
});
