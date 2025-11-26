const db = require('../config/db');
const blobService = require('../services/blobService');

exports.getAllRecipes = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query('SELECT * FROM recipes WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getRecipeById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const recipeResult = await db.query('SELECT * FROM recipes WHERE id = $1 AND user_id = $2', [id, userId]);
        if (recipeResult.rows.length === 0) return res.status(404).json({ error: 'Recipe not found' });

        const ingredientsResult = await db.query(
            `SELECT ri.id, ri.ingredient_id, i.name, ri.quantity, i.unit, ri.cost_contribution 
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
    const userId = req.user.id;
    let imageUrl = null;

    if (req.file) {
        try {
            imageUrl = await blobService.uploadImage(req.file);
        } catch (error) {
            console.error('Image upload failed:', error);
            // Continue without image or return error? Let's continue but warn.
        }
    }

    // ingredients is a JSON string if coming from FormData, or array if JSON
    let parsedIngredients = [];
    if (typeof ingredients === 'string') {
        try {
            parsedIngredients = JSON.parse(ingredients);
        } catch (e) {
            console.error('Failed to parse ingredients', e);
        }
    } else {
        parsedIngredients = ingredients || [];
    }

    const client = await db.query('BEGIN'); // Start transaction
    try {
        let totalCost = 0;

        // 1. Create Recipe
        const recipeRes = await db.query(
            'INSERT INTO recipes (name, description, preparation_time_minutes, sale_price, user_id, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [name, description, preparation_time_minutes, sale_price, userId, imageUrl]
        );
        const recipeId = recipeRes.rows[0].id;

        // 2. Add Ingredients and Calculate Cost
        if (parsedIngredients && parsedIngredients.length > 0) {
            for (const item of parsedIngredients) {
                // Check if ingredient belongs to user (optional strictly speaking if we trust ID, but good practice)
                // For now, just check existence and cost
                const ingRes = await db.query('SELECT cost_per_unit FROM ingredients WHERE id = $1 AND user_id = $2', [item.ingredient_id, userId]);
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
        res.status(201).json({ id: recipeId, message: 'Recipe created', total_cost: totalCost, profit_margin: profitMargin, image_url: imageUrl });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateRecipe = async (req, res) => {
    const { id } = req.params;
    const { name, description, preparation_time_minutes, sale_price, ingredients } = req.body;
    const userId = req.user.id;

    let imageUrl = undefined;
    if (req.file) {
        try {
            imageUrl = await blobService.uploadImage(req.file);
        } catch (error) {
            console.error('Image upload failed:', error);
        }
    }

    let parsedIngredients = [];
    if (typeof ingredients === 'string') {
        try {
            parsedIngredients = JSON.parse(ingredients);
        } catch (e) {
            console.error('Failed to parse ingredients', e);
        }
    } else {
        parsedIngredients = ingredients || [];
    }

    const client = await db.query('BEGIN');
    try {
        let totalCost = 0;

        // 1. Update Recipe Details
        let updateQuery = 'UPDATE recipes SET name = $1, description = $2, preparation_time_minutes = $3, sale_price = $4';
        let queryParams = [name, description, preparation_time_minutes, sale_price];

        if (imageUrl) {
            updateQuery += `, image_url = $${queryParams.length + 1}`;
            queryParams.push(imageUrl);
        }

        updateQuery += ` WHERE id = $${queryParams.length + 1} AND user_id = $${queryParams.length + 2} RETURNING id`;
        queryParams.push(id, userId);

        const recipeRes = await db.query(updateQuery, queryParams);

        if (recipeRes.rowCount === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Recipe not found or unauthorized' });
        }

        // 2. Delete Existing Ingredients
        await db.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [id]);

        // 3. Add New Ingredients and Calculate Cost
        if (parsedIngredients && parsedIngredients.length > 0) {
            for (const item of parsedIngredients) {
                const ingRes = await db.query('SELECT cost_per_unit FROM ingredients WHERE id = $1 AND user_id = $2', [item.ingredient_id, userId]);
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
        res.json({ id, message: 'Recipe updated', total_cost: totalCost, profit_margin: profitMargin, image_url: imageUrl });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

