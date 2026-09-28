const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// Users and login codes live in SQLite on the persistent volume; videos stay as job folders.
function openDb(dataDir) {
  const db = new DatabaseSync(path.join(dataDir, 'app.db'));
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE,
      email TEXT,
      name TEXT,
      google_sub TEXT UNIQUE,
      apple_sub TEXT UNIQUE,
      ai_consent_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS otp_codes (
      phone TEXT PRIMARY KEY,
      code_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      sent_at INTEGER NOT NULL
    );
  `);
  return db;
}

module.exports = { openDb };
