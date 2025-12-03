const db = require('../config/db');

async function debugRoutes() {
    const userId = 1;
    console.log(`Debugging for userId: ${userId}`);

    try {
        console.log('--- Testing Dashboard Logic ---');

        // 1. Financials
        console.log('Querying financial_periods...');
        const financialsQuery = `
            SELECT * FROM financial_periods 
            WHERE user_id = $1 
            ORDER BY period_date DESC 
            LIMIT 1
        `;
        const financialsRes = await db.query(financialsQuery, [userId]);
        console.log('Financials row:', financialsRes.rows[0]);

        // 2. Avg Margin
        console.log('Querying AVG margin...');
        const marginQuery = `
            SELECT AVG(profit_margin) as avg_margin 
            FROM recipes 
            WHERE user_id = $1
        `;
        const marginRes = await db.query(marginQuery, [userId]);
        console.log('Margin result:', marginRes.rows[0]);

        // 3. Top Products
        console.log('Querying Top Products...');
        const topProductsQuery = `
            SELECT name, profit_margin, sale_price 
            FROM recipes 
            WHERE user_id = $1 
            ORDER BY profit_margin DESC 
            LIMIT 5
        `;
        const topProductsRes = await db.query(topProductsQuery, [userId]);
        console.log('Top Products count:', topProductsRes.rows.length);

        // 4. History
        console.log('Querying History...');
        const historyQuery = `
            SELECT period_date, total_sales, 
                   (payroll + rent + utilities + other_fixed_costs) as fixed_costs
            FROM financial_periods
            WHERE user_id = $1
            ORDER BY period_date ASC
            LIMIT 6
        `;
        const historyRes = await db.query(historyQuery, [userId]);
        console.log('History count:', historyRes.rows.length);

        console.log('--- Testing Financials GET Logic ---');
        const allFinancials = await db.query(
            'SELECT * FROM financial_periods WHERE user_id = $1 ORDER BY period_date DESC',
            [userId]
        );
        console.log('All Financials count:', allFinancials.rows.length);

        console.log('✅ All queries executed successfully.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error during debug:', err);
        process.exit(1);
    }
}

debugRoutes();
