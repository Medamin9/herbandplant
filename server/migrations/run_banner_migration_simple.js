const db = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('Starting banner table migration...\n');
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'create_banners_table.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Remove comments and split by semicolon
        const statements = sqlContent
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n')
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement) {
                console.log(`Executing statement ${i + 1}/${statements.length}...`);
                await db.query(statement);
            }
        }
        
        console.log('\n✓ Migration completed successfully!');
        console.log('\nVerifying table creation...');
        
        // Verify the table was created
        const result = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'banners'
            ORDER BY ordinal_position;
        `);
        
        console.log('\nBanners table structure:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type}`);
        });
        
        // Check if default banner was inserted
        const bannerCount = await db.query('SELECT COUNT(*) as count FROM banners');
        console.log(`\nBanners in database: ${bannerCount.rows[0].count}`);
        
        if (parseInt(bannerCount.rows[0].count) > 0) {
            const banners = await db.query('SELECT * FROM banners');
            console.log('\nExisting banners:');
            banners.rows.forEach(banner => {
                console.log(`  - ID: ${banner.id}, Active: ${banner.is_active}`);
                console.log(`    Desktop: ${banner.desktop_image}`);
                console.log(`    Mobile: ${banner.mobile_image}`);
            });
        }
        
        console.log('\n✓ Migration verification complete!');
        process.exit(0);
        
    } catch (error) {
        console.error('\n✗ Migration failed:');
        console.error(error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

// Run the migration
runMigration();
