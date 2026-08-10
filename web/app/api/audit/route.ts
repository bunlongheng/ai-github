import { NextRequest, NextResponse } from "next/server";
import { upsertAuditReport } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.repo || !body.pr_number) {
      return NextResponse.json({ error: "repo and pr_number required" }, { status: 400 });
    }
    upsertAuditReport(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
