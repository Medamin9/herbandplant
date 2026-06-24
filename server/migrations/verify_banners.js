const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

async function verifyBanners() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying banner table...\n');
    
    // Get all banners
    const result = await client.query('SELECT * FROM banners ORDER BY created_at DESC');
    
    if (result.rows.length === 0) {
      console.log('❌ No banners found in the table');
    } else {
      console.log(`✅ Found ${result.rows.length} banner(s):\n`);
      
      result.rows.forEach((banner, index) => {
        console.log(`Banner #${index + 1}:`);
        console.log(`  ID: ${banner.id}`);
        console.log(`  Desktop Image: ${banner.desktop_image}`);
        console.log(`  Mobile Image: ${banner.mobile_image}`);
        console.log(`  Active: ${banner.is_active ? '✓ YES' : '✗ NO'}`);
        console.log(`  Created: ${banner.created_at}`);
        console.log(`  Updated: ${banner.updated_at}`);
        console.log('');
      });
    }
    
    // Check indexes
    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'banners'
    `);
    
    console.log('📊 Indexes:');
    indexes.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyBanners()
  .then(() => {
    console.log('\n✅ Verification complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Verification failed:', err);
    process.exit(1);
  });
