import pool from './db.js';

export async function runMigrations() {
  try {
    // Skip if not using SQLite (PostgreSQL handles this differently)
    const dbType = process.env.DB_TYPE || 'sqlite';
    if (dbType !== 'sqlite') {
      console.log('✓ Skipping migrations (not SQLite)');
      return;
    }

    console.log('Running database migrations...');

    // Check if the columns exist, if not add them
    // For SQLite, use PRAGMA to check columns
    try {
      const result = await pool.query("PRAGMA table_info(products)");
      
      // Handle both array (normal) and {data: array} format
      const rows = Array.isArray(result) ? result : (result.data || []);
      const columns = rows.map(col => col.name);

      if (!columns.includes('has_sizes')) {
        console.log('Adding has_sizes column...');
        try {
          await pool.query('ALTER TABLE products ADD COLUMN has_sizes BOOLEAN DEFAULT true');
        } catch (e) {
          console.log('Column has_sizes already exists');
        }
      }

      if (!columns.includes('available_sizes')) {
        console.log('Adding available_sizes column...');
        try {
          await pool.query("ALTER TABLE products ADD COLUMN available_sizes VARCHAR(255) DEFAULT 'S,M,L,XL'");
        } catch (e) {
          console.log('Column available_sizes already exists');
        }
      }

      if (!columns.includes('features')) {
        console.log('Adding features column...');
        try {
          await pool.query('ALTER TABLE products ADD COLUMN features TEXT');
        } catch (e) {
          console.log('Column features already exists');
        }
      }

      if (!columns.includes('specs')) {
        console.log('Adding specs column...');
        try {
          await pool.query("ALTER TABLE products ADD COLUMN specs TEXT DEFAULT '{}'");
        } catch (e) {
          console.log('Column specs already exists');
        }
      }

      if (!columns.includes('geometry')) {
        console.log('Adding geometry column...');
        try {
          await pool.query("ALTER TABLE products ADD COLUMN geometry TEXT DEFAULT '{}'");
        } catch (e) {
          console.log('Column geometry already exists');
        }
      }

      console.log('Migrations completed successfully!');
    } catch (err) {
      console.error('Error checking table structure:', err.message);
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}
