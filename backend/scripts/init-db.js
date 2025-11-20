const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const schemaPath = path.join(__dirname, '../models/schema.sql');

async function initDb() {
    try {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        console.log('Running schema.sql...');
        await db.query(schema);
        console.log('Database initialized successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    }
}

initDb();
