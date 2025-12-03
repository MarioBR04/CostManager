const db = require('../config/db');

async function verifySchema() {
    try {
        console.log('Verifying financial_periods table...');
        const res = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'financial_periods';
        `);

        if (res.rows.length === 0) {
            console.log('❌ Table financial_periods does NOT exist.');
        } else {
            console.log('✅ Table financial_periods exists with columns:');
            res.rows.forEach(row => {
                console.log(`   - ${row.column_name} (${row.data_type})`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error('Error verifying schema:', err);
        process.exit(1);
    }
}

verifySchema();
