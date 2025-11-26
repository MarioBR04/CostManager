const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const migrationPath = path.join(__dirname, '../migrations/002_add_user_scoping.sql');

async function runMigration() {
    try {
        const migration = fs.readFileSync(migrationPath, 'utf8');
        console.log('Running migration 002_add_user_scoping.sql...');
        await db.query(migration);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    }
}

runMigration();
