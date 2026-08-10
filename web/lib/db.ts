import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "..", "db", "audit.db");
const MIGRATIONS_DIR = path.join(process.cwd(), "..", "db", "migrations");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  runMigrations(_db);
  return _db;
}

function runMigrations(db: Database.Database) {
  const files = fs.readdirSync(MIGRATIONS_DIR).sort();
  for (const file of files) {
    if (!file.endsWith(".sql")) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    db.exec(sql);
  }
}

export interface AuditReport {
  repo: string;
  pr_number: number;
  audited_at: string;
  lang: string | null;
  stars: number | null;
  files_audited: FileAudited[];
  findings: Finding[];
  winner_summary: string | null;
  pr_body: string | null;
  talking_points: string[];
}

export interface FileAudited {
  path: string;
  role: string;
  patterns: string;
  result: string;
}

export interface Finding {
  type: string;
  file: string;
  line: number | string;
  code: string;
  fix: string;
  confidence: number;
  severity: string;
  realness: number;
  patchability: number;
  mergability: number;
  status: "winner" | "eliminated";
  eliminated_reason?: string;
}

export function getAuditReport(repo: string, prNumber: number): AuditReport | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM audit_reports WHERE repo = ? AND pr_number = ?").get(repo, prNumber) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    ...row,
    files_audited: JSON.parse((row.files_audited as string) || "[]"),
    findings: JSON.parse((row.findings as string) || "[]"),
    talking_points: JSON.parse((row.talking_points as string) || "[]"),
  } as AuditReport;
}

export function upsertAuditReport(report: Omit<AuditReport, "audited_at">) {
  const db = getDb();
  db.prepare(`
    INSERT INTO audit_reports (repo, pr_number, lang, stars, files_audited, findings, winner_summary, pr_body, talking_points)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (repo, pr_number) DO UPDATE SET
      lang = excluded.lang, stars = excluded.stars,
      files_audited = excluded.files_audited, findings = excluded.findings,
      winner_summary = excluded.winner_summary, pr_body = excluded.pr_body,
      talking_points = excluded.talking_points,
      audited_at = datetime('now')
  `).run(
    report.repo, report.pr_number, report.lang, report.stars,
    JSON.stringify(report.files_audited),
    JSON.stringify(report.findings),
    report.winner_summary, report.pr_body,
    JSON.stringify(report.talking_points),
  );
}

export function hasAuditReport(repo: string, prNumber: number): boolean {
  const db = getDb();
  const row = db.prepare("SELECT 1 FROM audit_reports WHERE repo = ? AND pr_number = ?").get(repo, prNumber);
  return !!row;
}
