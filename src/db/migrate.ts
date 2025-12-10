import { Database } from "bun:sqlite";

export function runMigrations(db: Database) {
  console.log("Running migrations...");

  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Create queries table for persistent history
  db.run(`
    CREATE TABLE IF NOT EXISTS queries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      dataset_id TEXT,
      sql TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT,
      duration_ms INTEGER,
      row_count INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (dataset_id) REFERENCES datasets(id)
    )
  `);

  // Create user_settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      result_layout TEXT NOT NULL DEFAULT 'horizontal',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Check if user_id column exists in datasets table
  const datasetsInfo = db.query("PRAGMA table_info(datasets)").all() as any[];
  const hasUserId = datasetsInfo.some((col: any) => col.name === 'user_id');

  if (!hasUserId) {
    console.log("Adding user_id to datasets table...");
    
    // For development: Create a default admin user if none exists
    const adminExists = db.query("SELECT id FROM users WHERE email = 'admin@bunlytics.local'").get();
    
    if (!adminExists) {
      const adminId = crypto.randomUUID();
      const now = new Date().toISOString();
      // Default password: "admin123" - should be changed in production
      const defaultPasswordHash = "$2a$10$rN8qJ5K5vZ5J5K5vZ5J5Ku7YxqJ5K5vZ5J5K5vZ5J5K5vZ5J5K5vZ"; // bcrypt hash of "admin123"
      
      db.run(
        "INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        [adminId, "admin@bunlytics.local", defaultPasswordHash, now, now]
      );
      
      console.log("Created default admin user (email: admin@bunlytics.local, password: admin123)");
      
      // Add user_id column with default value
      db.run(`ALTER TABLE datasets ADD COLUMN user_id TEXT NOT NULL DEFAULT '${adminId}'`);
      
      // Assign existing datasets to admin
      db.run(`UPDATE datasets SET user_id = '${adminId}' WHERE user_id = '${adminId}'`);
    } else {
      const admin = adminExists as any;
      db.run(`ALTER TABLE datasets ADD COLUMN user_id TEXT NOT NULL DEFAULT '${admin.id}'`);
    }
  }

  // Check and add user_id to dashboards
  const dashboardsInfo = db.query("PRAGMA table_info(dashboards)").all() as any[];
  const dashboardsHasUserId = dashboardsInfo.some((col: any) => col.name === 'user_id');

  if (!dashboardsHasUserId) {
    const admin = db.query("SELECT id FROM users WHERE email = 'admin@bunlytics.local'").get() as any;
    if (admin) {
      db.run(`ALTER TABLE dashboards ADD COLUMN user_id TEXT NOT NULL DEFAULT '${admin.id}'`);
    }
  }

  // Check and add user_id to panels
  const panelsInfo = db.query("PRAGMA table_info(panels)").all() as any[];
  const panelsHasUserId = panelsInfo.some((col: any) => col.name === 'user_id');

  if (!panelsHasUserId) {
    const admin = db.query("SELECT id FROM users WHERE email = 'admin@bunlytics.local'").get() as any;
    if (admin) {
      db.run(`ALTER TABLE panels ADD COLUMN user_id TEXT NOT NULL DEFAULT '${admin.id}'`);
    }
  }

  console.log("Migrations complete!");
}
