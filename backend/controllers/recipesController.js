const db = require('../config/db');

exports.getAllRecipes = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM recipes ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getRecipeById = async (req, res) => {
    const { id } = req.params;
    try {
        const recipeResult = await db.query('SELECT * FROM recipes WHERE id = $1', [id]);
        if (recipeResult.rows.length === 0) return res.status(404).json({ error: 'Recipe not found' });

        const ingredientsResult = await db.query(
            `SELECT ri.id, i.name, ri.quantity, i.unit, ri.cost_contribution 
         FROM recipe_ingredients ri 
         JOIN ingredients i ON ri.ingredient_id = i.id 
         WHERE ri.recipe_id = $1`,
            [id]
        );

        const recipe = recipeResult.rows[0];
        recipe.ingredients = ingredientsResult.rows;
        res.json(recipe);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.createRecipe = async (req, res) => {
    const { name, description, preparation_time_minutes, sale_price, ingredients } = req.body;
    // ingredients is an array of { ingredient_id, quantity }

    const client = await db.query('BEGIN'); // Start transaction
    try {
        let totalCost = 0;

        // 1. Create Recipe
        const recipeRes = await db.query(
            'INSERT INTO recipes (name, description, preparation_time_minutes, sale_price) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, description, preparation_time_minutes, sale_price]
        );
        const recipeId = recipeRes.rows[0].id;

        // 2. Add Ingredients and Calculate Cost
        if (ingredients && ingredients.length > 0) {
            for (const item of ingredients) {
                const ingRes = await db.query('SELECT cost_per_unit FROM ingredients WHERE id = $1', [item.ingredient_id]);
                if (ingRes.rows.length > 0) {
                    const costPerUnit = ingRes.rows[0].cost_per_unit;
                    const costContribution = costPerUnit * item.quantity;
                    totalCost += costContribution;

                    await db.query(
                        'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, cost_contribution) VALUES ($1, $2, $3, $4)',
                        [recipeId, item.ingredient_id, item.quantity, costContribution]
                    );
                }
            }
        }

        // 3. Update Recipe with Total Cost and Margin
        let profitMargin = 0;
        if (sale_price > 0) {
            profitMargin = ((sale_price - totalCost) / sale_price) * 100;
        }

        await db.query(
            'UPDATE recipes SET total_cost = $1, profit_margin = $2 WHERE id = $3',
            [totalCost, profitMargin, recipeId]
        );

        await db.query('COMMIT');
        res.status(201).json({ id: recipeId, message: 'Recipe created', total_cost: totalCost, profit_margin: profitMargin });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateRecipe = async (req, res) => {
    const { id } = req.params;
    const { name, description, preparation_time_minutes, sale_price, ingredients } = req.body;

    const client = await db.query('BEGIN');
    try {
        let totalCost = 0;

        // 1. Update Recipe Details
        const recipeRes = await db.query(
            'UPDATE recipes SET name = $1, description = $2, preparation_time_minutes = $3, sale_price = $4 WHERE id = $5 RETURNING id',
            [name, description, preparation_time_minutes, sale_price, id]
        );

        if (recipeRes.rowCount === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Recipe not found' });
        }

        // 2. Delete Existing Ingredients
        await db.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [id]);

        // 3. Add New Ingredients and Calculate Cost
        if (ingredients && ingredients.length > 0) {
            for (const item of ingredients) {
                const ingRes = await db.query('SELECT cost_per_unit FROM ingredients WHERE id = $1', [item.ingredient_id]);
                if (ingRes.rows.length > 0) {
                    const costPerUnit = ingRes.rows[0].cost_per_unit;
                    const costContribution = costPerUnit * item.quantity;
                    totalCost += costContribution;

                    await db.query(
                        'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, cost_contribution) VALUES ($1, $2, $3, $4)',
                        [id, item.ingredient_id, item.quantity, costContribution]
                    );
                }
            }
        }

        // 4. Update Recipe with Total Cost and Margin
        let profitMargin = 0;
        if (sale_price > 0) {
            profitMargin = ((sale_price - totalCost) / sale_price) * 100;
        }

        await db.query(
            'UPDATE recipes SET total_cost = $1, profit_margin = $2 WHERE id = $3',
            [totalCost, profitMargin, id]
        );

        await db.query('COMMIT');
        res.json({ id, message: 'Recipe updated', total_cost: totalCost, profit_margin: profitMargin });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
