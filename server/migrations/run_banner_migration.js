const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting banner table migration...');
    console.log(`📊 Database: ${process.env.PGDATABASE}`);
    console.log(`👤 User: ${process.env.PGUSER}`);
    
    // Read the SQL file
    const sql = fs.readFileSync(
      path.join(__dirname, 'create_banners_table.sql'),
      'utf8'
    );
    
    // Execute the migration
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Banner table created successfully!');
    
    // Verify the table was created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'banners'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Table "banners" exists in database');
      
      // Check if default banner was inserted
      const bannerCheck = await client.query('SELECT COUNT(*) as count FROM banners');
      console.log(`📊 Banners in table: ${bannerCheck.rows[0].count}`);
      
      // Show table structure
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'banners'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Table structure:');
      structure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('❌ Table "banners" was not created');
    }
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Migration failed:', err);
    process.exit(1);
  });
