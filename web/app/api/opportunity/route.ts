import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const STATE_FILE = join(process.cwd(), "data/pipeline.json");

function readState() {
  if (!existsSync(STATE_FILE)) return null;
  return JSON.parse(readFileSync(STATE_FILE, "utf8"));
}

function writeState(state: unknown) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export async function PATCH(req: Request) {
  const { id, repo, action } = await req.json();
  const state = readState();
  if (!state) return NextResponse.json({ error: "no state" }, { status: 404 });

  if (action === "favorite" || action === "unfavorite") {
    const isFav = state.favorites.includes(repo);
    if (isFav) {
      state.favorites = state.favorites.filter((f: string) => f !== repo);
    } else {
      state.favorites.push(repo);
    }
    // Update is_favorite on all opportunities for this repo
    for (const opp of state.opportunities) {
      if (opp.repo === repo) {
        opp.is_favorite = !isFav;
      }
    }
  }

  if (action === "skip") {
    const opp = state.opportunities.find((o: { id: string }) => o.id === id);
    if (opp) opp.status = "skipped";
  }

  if (action === "unskip") {
    const opp = state.opportunities.find((o: { id: string }) => o.id === id);
    if (opp) opp.status = "opportunity";
  }

  writeState(state);
  return NextResponse.json({ ok: true });
}
