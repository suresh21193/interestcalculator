import Database from 'better-sqlite3';
import path from 'path';

// Initialize SQLite database (stored in the project's root)
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'src', 'data', 'database.db');
console.log(dbPath);
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');


// Create Client table
db.exec(`
    CREATE TABLE  IF NOT EXISTS Client 
    (
        ClientID INTEGER PRIMARY KEY,
        Name TEXT,
        MobileNumber TEXT,
        Place TEXT,
        Address TEXT,
        Zone TEXT,
        Status TEXT
    );
`);

// Create Principal table
db.exec(`
    CREATE TABLE  IF NOT EXISTS Principal 
    (
        PrincipalID INTEGER PRIMARY KEY,
        PrincipalAmount REAL,
        StartDate DATE,
        Term INTEGER,
        InterestAmount REAL,
        Remarks TEXT,
        Status TEXT,
        ClosedDate DATE,
        ClientID INTEGER,
        FOREIGN KEY (ClientID) REFERENCES Client(ClientID) ON DELETE CASCADE
    );
`);

// Create Interest table
db.exec(`
    CREATE TABLE  IF NOT EXISTS Interest 
    (
        InterestID INTEGER PRIMARY KEY,
        InterestReceived REAL,
        InterestMonth DATE,
        InterestReceivedDate DATE,
        Status TEXT,
        PrincipalID INTEGER,
        FOREIGN KEY (PrincipalID) REFERENCES Principal(PrincipalID) ON DELETE CASCADE
    );
`);

export default db;
