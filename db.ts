import Database from 'better-sqlite3';

const db = new Database('exams.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS solutions (
    question_id INTEGER PRIMARY KEY,
    correct_option TEXT NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions (id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS exam_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Enforce only one row
    title TEXT NOT NULL
  );
`);

export default db;
