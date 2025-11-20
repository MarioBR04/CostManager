const express = require('express');
const router = express.Router();

const ingredientsController = require('../controllers/ingredientsController');
const recipesController = require('../controllers/recipesController');


// Ingredients Routes
router.get('/ingredients', ingredientsController.getAllIngredients);
router.post('/ingredients', ingredientsController.createIngredient);
router.put('/ingredients/:id', ingredientsController.updateIngredient);
router.delete('/ingredients/:id', ingredientsController.deleteIngredient);

// Recipes Routes
router.get('/recipes', recipesController.getAllRecipes);
router.get('/recipes/:id', recipesController.getRecipeById);
router.post('/recipes', recipesController.createRecipe);
router.put('/recipes/:id', recipesController.updateRecipe);

module.exports = router;
