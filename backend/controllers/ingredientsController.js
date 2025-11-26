const db = require('../config/db');

exports.getAllIngredients = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query('SELECT * FROM ingredients WHERE user_id = $1 ORDER BY name ASC', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.createIngredient = async (req, res) => {
    const { name, unit, cost_per_unit, supplier } = req.body;
    const userId = req.user.id;
    try {
        const result = await db.query(
            'INSERT INTO ingredients (name, unit, cost_per_unit, supplier, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, unit, cost_per_unit, supplier, userId]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateIngredient = async (req, res) => {
    const { id } = req.params;
    const { name, unit, cost_per_unit, supplier } = req.body;
    const userId = req.user.id;
    try {
        const result = await db.query(
            'UPDATE ingredients SET name = $1, unit = $2, cost_per_unit = $3, supplier = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
            [name, unit, cost_per_unit, supplier, id, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ingredient not found or unauthorized' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteIngredient = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const result = await db.query('DELETE FROM ingredients WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ingredient not found or unauthorized' });
        }
        res.json({ message: 'Ingredient deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

