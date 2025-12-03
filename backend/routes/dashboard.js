const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get Dashboard Data
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId || 1;

        // 1. Get Financials for the latest month
        const financialsQuery = `
            SELECT * FROM financial_periods 
            WHERE user_id = $1 
            ORDER BY period_date DESC 
            LIMIT 1
        `;
        const financialsRes = await db.query(financialsQuery, [userId]);
        const currentFinancials = financialsRes.rows[0] || {};

        // 2. Calculate Average Margin from Recipes
        const marginQuery = `
            SELECT AVG(profit_margin) as avg_margin 
            FROM recipes 
            WHERE user_id = $1
        `;
        const marginRes = await db.query(marginQuery, [userId]);
        const avgMargin = parseFloat(marginRes.rows[0].avg_margin || 0);

        // 3. Calculate Break Even Point
        // BEP = Fixed Costs / (Average Margin / 100)
        const fixedCosts =
            parseFloat(currentFinancials.payroll || 0) +
            parseFloat(currentFinancials.rent || 0) +
            parseFloat(currentFinancials.utilities || 0) +
            parseFloat(currentFinancials.other_fixed_costs || 0);

        let breakEvenPoint = 0;
        if (avgMargin > 0) {
            breakEvenPoint = fixedCosts / (avgMargin / 100);
        }

        // 4. Get Top 5 Products by Margin
        const topProductsQuery = `
            SELECT name, profit_margin, sale_price 
            FROM recipes 
            WHERE user_id = $1 
            ORDER BY profit_margin DESC 
            LIMIT 5
        `;
        const topProductsRes = await db.query(topProductsQuery, [userId]);

        // 5. Get Sales History (last 6 months) for charts
        const historyQuery = `
            SELECT period_date, total_sales, 
                   (payroll + rent + utilities + other_fixed_costs) as fixed_costs
            FROM financial_periods
            WHERE user_id = $1
            ORDER BY period_date ASC
            LIMIT 6
        `;
        const historyRes = await db.query(historyQuery, [userId]);

        res.json({
            currentMonth: currentFinancials.period_date,
            fixedCosts,
            avgMargin,
            breakEvenPoint,
            totalSales: parseFloat(currentFinancials.total_sales || 0),
            topProducts: topProductsRes.rows,
            history: historyRes.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
