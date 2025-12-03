const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get financial data for a specific month (or all if not specified)
router.get('/', async (req, res) => {
    try {
        // Assuming user_id is 1 for MVP as per previous context, or passed in query
        // In a real app, this would come from the auth token
        const userId = req.query.userId || 1;

        const result = await db.query(
            'SELECT * FROM financial_periods WHERE user_id = $1 ORDER BY period_date DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Upsert financial data for a month
router.post('/', async (req, res) => {
    const { userId, periodDate, payroll, rent, utilities, otherFixedCosts, totalSales } = req.body;

    // Basic validation
    if (!periodDate) {
        return res.status(400).json({ error: 'Period date is required' });
    }

    // Default to user 1 if not provided (MVP)
    const finalUserId = userId || 1;

    try {
        // Check if record exists
        const check = await db.query(
            'SELECT id FROM financial_periods WHERE user_id = $1 AND period_date = $2',
            [finalUserId, periodDate]
        );

        if (check.rows.length > 0) {
            // Update
            const updateQuery = `
                UPDATE financial_periods 
                SET payroll = $1, rent = $2, utilities = $3, other_fixed_costs = $4, total_sales = $5
                WHERE user_id = $6 AND period_date = $7
                RETURNING *
            `;
            const result = await db.query(updateQuery, [
                payroll || 0, rent || 0, utilities || 0, otherFixedCosts || 0, totalSales || 0,
                finalUserId, periodDate
            ]);
            res.json(result.rows[0]);
        } else {
            // Insert
            const insertQuery = `
                INSERT INTO financial_periods (user_id, period_date, payroll, rent, utilities, other_fixed_costs, total_sales)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            const result = await db.query(insertQuery, [
                finalUserId, periodDate,
                payroll || 0, rent || 0, utilities || 0, otherFixedCosts || 0, totalSales || 0
            ]);
            res.json(result.rows[0]);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
