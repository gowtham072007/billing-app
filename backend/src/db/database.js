const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

function getDbDir() {
  if (process.env.VERCEL) return '/tmp';
  const defaultDir = path.resolve(__dirname, '../../data');
  try {
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }
    return defaultDir;
  } catch {
    return '/tmp';
  }
}

const dbDir = getDbDir();
const dbPath = path.join(dbDir, 'billing_app.db');

class SqliteDbWrapper {
  constructor() {
    this.rawDb = null;
    this.inTransaction = false;
  }

  async init() {
    if (this.rawDb) return this;

    let SQL;
    try {
      const wasmBinaryPath = path.join(path.dirname(require.resolve('sql.js')), 'sql-wasm.wasm');
      if (fs.existsSync(wasmBinaryPath)) {
        const wasmBinary = fs.readFileSync(wasmBinaryPath);
        SQL = await initSqlJs({ wasmBinary });
      } else {
        SQL = await initSqlJs();
      }
    } catch {
      SQL = await initSqlJs();
    }

    if (fs.existsSync(dbPath)) {
      try {
        const fileBuffer = fs.readFileSync(dbPath);
        this.rawDb = new SQL.Database(fileBuffer);
      } catch (err) {
        console.warn('Could not read existing db file, creating new one:', err);
        this.rawDb = new SQL.Database();
        this.saveToDisk();
      }
    } else {
      this.rawDb = new SQL.Database();
      this.saveToDisk();
    }

    return this;
  }

  saveToDisk() {
    if (!this.rawDb || this.inTransaction) return;
    try {
      const data = this.rawDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (err) {
      console.error('Error saving SQLite database to disk:', err.message);
    }
  }

  pragma(str) {
    if (!this.rawDb) return;
    try {
      this.rawDb.run(`PRAGMA ${str};`);
    } catch (err) {
      // ignore
    }
  }

  exec(sql) {
    if (!this.rawDb) throw new Error('Database not initialized');
    this.rawDb.run(sql);
    if (!this.inTransaction) {
      this.saveToDisk();
    }
  }

  prepare(sql) {
    if (!this.rawDb) throw new Error('Database not initialized');
    const self = this;

    return {
      all(...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = self.rawDb.prepare(sql);
        try {
          if (flatParams.length > 0) {
            stmt.bind(flatParams);
          }
          const results = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          return results;
        } finally {
          stmt.free();
        }
      },

      get(...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = self.rawDb.prepare(sql);
        try {
          if (flatParams.length > 0) {
            stmt.bind(flatParams);
          }
          if (stmt.step()) {
            return stmt.getAsObject();
          }
          return undefined;
        } finally {
          stmt.free();
        }
      },

      run(...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        self.rawDb.run(sql, flatParams);

        const lastIdRes = self.rawDb.exec('SELECT last_insert_rowid()');
        const lastInsertRowid =
          lastIdRes.length > 0 && lastIdRes[0].values.length > 0
            ? Number(lastIdRes[0].values[0][0])
            : 0;

        const changes = self.rawDb.getRowsModified ? self.rawDb.getRowsModified() : 1;

        if (!self.inTransaction) {
          self.saveToDisk();
        }

        return { lastInsertRowid, changes };
      }
    };
  }

  transaction(fn) {
    const self = this;
    return function (...args) {
      self.inTransaction = true;
      self.rawDb.run('BEGIN TRANSACTION;');
      try {
        const result = fn(...args);
        self.rawDb.run('COMMIT;');
        self.inTransaction = false;
        self.saveToDisk();
        return result;
      } catch (err) {
        try {
          self.rawDb.run('ROLLBACK;');
        } catch (e) {
          // ignore
        }
        self.inTransaction = false;
        throw err;
      }
    };
  }
}

const db = new SqliteDbWrapper();
module.exports = db;
