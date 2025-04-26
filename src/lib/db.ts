import Database from 'better-sqlite3';
import path from 'path';

// Initialize SQLite database (stored in the project's root)
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'src', 'data', 'database.db');
console.log(dbPath);
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');


// Create employees table
db.exec(`
    CREATE TABLE IF NOT EXISTS employees
    (
        "empid" INTEGER,
        "name"  TEXT NOT NULL,
        "role"  TEXT NOT NULL,
        PRIMARY KEY ("empid")
    );
`);

// Create officeexpenses table
db.exec(`
    CREATE TABLE IF NOT EXISTS officeexpenses
    (
        "officeexpenseid" INTEGER,
        "name"            TEXT           NOT NULL,
        "cost"            NUMERIC(15, 2) NOT NULL,
        "dateofexpense"   DATE           NOT NULL,
        "remarks"         TEXT,
        PRIMARY KEY ("officeexpenseid")
    )
`);

// Create pettycash table
db.exec(`
    CREATE TABLE IF NOT EXISTS pettycash
    (
        "pettycashid"     INTEGER,
        "empid"           INTEGER,
        "pettycash"       NUMERIC(15, 2) NOT NULL,
        "dateofpettycash" DATE           NOT NULL,
        PRIMARY KEY ("pettycashid"),
        FOREIGN KEY ("empid") REFERENCES "employees" ("empid") ON DELETE CASCADE
    );
`);

// Create projectexpenses table
db.exec(`
    CREATE TABLE IF NOT EXISTS projectexpenses  (
      expenseid INTEGER PRIMARY KEY,
      projectid INTEGER,
      empid INTEGER,
      expensename TEXT NOT NULL,
      amount NUMERIC(15,2) NOT NULL,
      type TEXT NOT NULL,
      dateofexpense DATE NOT NULL,
      remarks TEXT,
      FOREIGN KEY (projectid) REFERENCES projects(projectid) ON DELETE CASCADE,
      FOREIGN KEY (empid) REFERENCES employees(empid) ON DELETE CASCADE
    );
`);

// Create projectexpenses table
db.exec(`
    CREATE TABLE IF NOT EXISTS projectexpenses  (
      expenseid INTEGER PRIMARY KEY,
      projectid INTEGER,
      empid INTEGER,
      expensename TEXT NOT NULL,
      amount NUMERIC(15,2) NOT NULL,
      type TEXT NOT NULL,
      dateofexpense DATE NOT NULL,
      remarks TEXT,
      FOREIGN KEY (projectid) REFERENCES projects(projectid) ON DELETE CASCADE,
      FOREIGN KEY (empid) REFERENCES employees(empid) ON DELETE CASCADE
    );
`);

// Create projects table
db.exec(`
    CREATE TABLE IF NOT EXISTS projects  (
        projectid INTEGER PRIMARY KEY,
        projectname TEXT NOT NULL,
        location TEXT NOT NULL,
        projectcost NUMERIC(15,2),
        description TEXT,
        income NUMERIC(15,2)
    );
`);

export default db;
