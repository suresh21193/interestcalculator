import Database from 'better-sqlite3';
import path from 'path';

// Initialize SQLite database (stored in the project's root)
console.log("suresh");
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'src', 'data', 'database.db');
console.log(dbPath);
console.log("suresh");
const db = new Database(dbPath);
console.log("suresh2");

console.log("suresh3");

export default db;
