import "server-only";
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { join } from "path";

export async function POST() {
  const rootDir = join(process.cwd(), "..");
  // Fire-and-forget discovery scan
  const child = exec("node scripts/discover.mjs", {
    cwd: rootDir,
    env: { ...process.env },
  });
  child.unref?.();
  return NextResponse.json({ ok: true, pid: child.pid });
}
