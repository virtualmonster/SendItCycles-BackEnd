import dotenv from 'dotenv';

dotenv.config();

const USE_SQLITE = process.env.USE_SQLITE === 'true';

let db;

async function initializeDatabase() {
  if (USE_SQLITE) {
    // SQLite mode (demo/lightweight)
    const { default: Database } = await import('better-sqlite3');
    db = new Database(process.env.SQLITE_PATH || '/data/senditcycles.db');
    db.pragma('journal_mode = WAL');
    
    // Create schema if tables don't exist
    const tableCount = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get();
    if (tableCount.count === 0) {
      console.log('Creating SQLite schema...');
      const fs = (await import('fs')).default;
      const initScript = fs.readFileSync('./database/init.sql', 'utf-8');
      const statements = initScript.split(';').filter(s => s.trim());
      statements.forEach(stmt => {
        try {
          db.exec(stmt);
        } catch (e) {
          console.warn(`Warning creating schema: ${e.message}`);
        }
      });
      console.log('✓ SQLite schema created');
    }
    
    console.log('✓ Connected to SQLite database');
  } else {
    // PostgreSQL mode (production)
    const { Pool } = await import('pg');
    db = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
    });

    db.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    console.log('✓ Connected to PostgreSQL database');
  }
  return db;
}

// Query function to handle both SQLite and PostgreSQL syntax differences
async function query(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }

  if (USE_SQLITE) {
    try {
      // Handle transactions
      if (sql.trim().toUpperCase() === 'BEGIN') {
        db.exec('BEGIN');
        return { rows: [] };
      }
      if (sql.trim().toUpperCase() === 'COMMIT') {
        db.exec('COMMIT');
        return { rows: [] };
      }
      if (sql.trim().toUpperCase() === 'ROLLBACK') {
        db.exec('ROLLBACK');
        return { rows: [] };
      }

      // Store original SQL to detect RETURNING
      const originalSql = sql;
      const hasReturning = /RETURNING\s+\*/i.test(sql);

      // Convert PostgreSQL-style placeholders to SQLite
      let sqliteSql = sql
        .replace(/RETURNING\s+\*/gi, '') // Remove RETURNING clause
        .replace(/CURRENT_TIMESTAMP/g, "datetime('now')") // Must come BEFORE TIMESTAMP replacement
        .replace(/\$(\d+)/g, '?')
        .replace(/SERIAL/g, 'INTEGER')
        .replace(/DECIMAL\([^)]+\)/g, 'REAL')
        .replace(/TIMESTAMP/g, 'DATETIME')
        .replace(/COALESCE/gi, 'COALESCE')
        .replace(/ON CONFLICT DO NOTHING/gi, '')
        .replace(/ON CONFLICT[^;]+DO NOTHING/gi, '')
        // Handle json_agg and json_build_object - these will be handled in result processing
        .replace(/json_agg\([^)]+\)/gi, "json_array()")
        .replace(/json_build_object\([^)]+\)/gi, "json_object()")
        .replace(/::float/g, '')
        .replace(/::int/g, '')
        .replace(/::text/g, '')
        .replace(/REFERENCES[^(]+\(/g, 'REFERENCES ');

      const isSelect = sqliteSql.trim().toUpperCase().startsWith('SELECT');
      const isInsert = sqliteSql.trim().toUpperCase().startsWith('INSERT');
      const isUpdate = sqliteSql.trim().toUpperCase().startsWith('UPDATE');
      const isDelete = sqliteSql.trim().toUpperCase().startsWith('DELETE');

      const stmt = db.prepare(sqliteSql);

      if (isSelect) {
        const rows = stmt.all(...params);
        return { rows };
      } else if (isInsert) {
        const info = stmt.run(...params);
        
        // If RETURNING was used, fetch the inserted row
        if (hasReturning) {
          // Extract table name from INSERT statement
          const tableMatch = originalSql.match(/INSERT\s+INTO\s+(\w+)/i);
          if (tableMatch) {
            const tableName = tableMatch[1];
            const getLastRow = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
            const row = getLastRow.get(info.lastInsertRowid);
            return { rows: row ? [row] : [], rowCount: info.changes };
          }
        }
        return { rows: [{ id: info.lastInsertRowid }], rowCount: info.changes };
      } else if (isUpdate) {
        const info = stmt.run(...params);
        
        // If RETURNING was used, fetch the updated row
        if (hasReturning) {
          // Extract table and WHERE clause
          const tableMatch = originalSql.match(/UPDATE\s+(\w+)/i);
          const whereMatch = originalSql.match(/WHERE\s+(.+?)\s+RETURNING/i);
          if (tableMatch && whereMatch) {
            const tableName = tableMatch[1];
            const whereClause = whereMatch[1];
            
            // Extract which parameter numbers are used in WHERE clause
            const paramMatches = [...whereClause.matchAll(/\$(\d+)/g)];
            const whereParams = paramMatches.map(m => params[parseInt(m[1]) - 1]);
            
            // Replace placeholders with ?
            const sqliteWhereClause = whereClause.replace(/\$(\d+)/g, '?');
            const selectSql = `SELECT * FROM ${tableName} WHERE ${sqliteWhereClause}`;
            const selectStmt = db.prepare(selectSql);
            const row = selectStmt.get(...whereParams);
            return { rows: row ? [row] : [], rowCount: info.changes };
          }
        }
        return { rowCount: info.changes, rows: [] };
      } else if (isDelete) {
        const info = stmt.run(...params);
        
        // If RETURNING was used, we can't fetch since row is deleted
        // But we can still report success
        if (hasReturning) {
          return { rows: [], rowCount: info.changes };
        }
        return { rowCount: info.changes };
      } else {
        // Other statements (like PRAGMA)
        stmt.run(...params);
        return { rows: [] };
      }
    } catch (err) {
      console.error('SQLite query error:', err.message);
      throw err;
    }
  } else {
    // PostgreSQL
    try {
      return await db.query(sql, params);
    } catch (err) {
      console.error('PostgreSQL query error:', err);
      throw err;
    }
  }
}

// Export as an object with query method (for backward compatibility with routes)
export default { query };
export { initializeDatabase, query };
