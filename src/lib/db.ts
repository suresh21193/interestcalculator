import Database from 'better-sqlite3';
import path from 'path';

// Initialize SQLite database (stored in the project's root)
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'src', 'data', 'database.db');
console.log(dbPath);
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export default db;
