import { Database } from "bun:sqlite";
import { mkdir } from "node:fs/promises";
import { runMigrations } from "./migrate";

// Ensure data directory exists
await mkdir("data", { recursive: true });

export const db = new Database("bunlytics.db");

// Enable WAL mode for better concurrency
db.exec("PRAGMA journal_mode = WAL;");

export function initDB() {
  db.run(`
    CREATE TABLE IF NOT EXISTS datasets (
      id TEXT PRIMARY KEY,
      name TEXT,
      source_type TEXT,
      file_path TEXT,
      table_name TEXT,
      row_count INTEGER,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dashboards (
      id TEXT PRIMARY KEY,
      name TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS panels (
      id TEXT PRIMARY KEY,
      dashboard_id TEXT,
      title TEXT,
      panel_type TEXT,
      sql TEXT,
      x_field TEXT,
      y_field TEXT,
      options_json TEXT,
      sort_order INTEGER,
      FOREIGN KEY(dashboard_id) REFERENCES dashboards(id)
    )
  `);
  
  console.log("Database initialized");
  
  // Run migrations to add auth tables and user_id columns
  runMigrations(db);
}

initDB();
