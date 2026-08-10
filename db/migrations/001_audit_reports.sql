CREATE TABLE IF NOT EXISTS audit_reports (
  repo        TEXT NOT NULL,
  pr_number   INTEGER NOT NULL,
  audited_at  TEXT DEFAULT (datetime('now')),
  lang        TEXT,
  stars       INTEGER,
  files_audited TEXT, -- JSON array: [{path, role, patterns, result}]
  findings      TEXT, -- JSON array: [{type, file, line, code, fix, confidence, realness, patchability, mergability, status, eliminated_reason}]
  winner_summary TEXT,
  pr_body       TEXT,
  talking_points TEXT, -- JSON array of strings
  PRIMARY KEY (repo, pr_number)
);
