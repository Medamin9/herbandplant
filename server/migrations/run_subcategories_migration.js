// run_subcategories_migration.js
require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const db = require('../db');

async function runMigration() {
  try {
    console.log('Running subcategories migration...');
    console.log('Database config:', {
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      port: process.env.PGPORT,
      hasPassword: !!process.env.PGPASSWORD
    });
    
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'add_subcategories.sql'),
      'utf8'
    );
    
    await db.query(migrationSQL);
    
    console.log('✓ Subcategories migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('✗ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
