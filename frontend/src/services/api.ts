import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getIngredients = () => api.get('/ingredients');
export const createIngredient = (data: any) => api.post('/ingredients', data);
export const deleteIngredient = (id: number) => api.delete(`/ingredients/${id}`);

export const getRecipes = () => api.get('/recipes');
export const getRecipeById = (id: number) => api.get(`/recipes/${id}`);
export const createRecipe = (data: any) => api.post('/recipes', data);
export const updateRecipe = (id: number, data: any) => api.put(`/recipes/${id}`, data);
export const updateIngredient = (id: number, data: any) => api.put(`/ingredients/${id}`, data);


