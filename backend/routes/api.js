const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const ingredientsController = require('../controllers/ingredientsController');
const recipesController = require('../controllers/recipesController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes below
router.use(authMiddleware);

// Ingredients Routes
router.get('/ingredients', ingredientsController.getAllIngredients);
router.post('/ingredients', ingredientsController.createIngredient);
router.put('/ingredients/:id', ingredientsController.updateIngredient);
router.delete('/ingredients/:id', ingredientsController.deleteIngredient);

// Recipes Routes
router.get('/recipes', recipesController.getAllRecipes);
router.get('/recipes/:id', recipesController.getRecipeById);
router.post('/recipes', upload.single('image'), recipesController.createRecipe);
router.put('/recipes/:id', upload.single('image'), recipesController.updateRecipe);

module.exports = router;

