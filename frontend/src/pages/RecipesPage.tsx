import React, { useEffect, useState } from 'react';
import { getRecipes, createRecipe, getIngredients, updateRecipe, getRecipeById } from '../services/api';

interface Recipe {
    id: number;
    name: string;
    description: string;
    preparation_time_minutes: number;
    total_cost: number;
    sale_price: number;
    profit_margin: number;
    image_url?: string;
    ingredients?: any[];
}

interface Ingredient {
    id: number;
    name: string;
    cost_per_unit: number;
    unit: string;
}

// Conversion factors to base unit (e.g., to grams, to ml, or 1 for pieces)
const unitConversions: Record<string, number> = {
    'kg': 1000, // to g
    'g': 1,
    'lb': 453.592, // to g
    'oz': 28.3495, // to g
    'litro': 1000, // to ml
    'ml': 1,
    'galon': 3785.41, // to ml
    'pieza': 1,
    'docena': 12, // to pieza
    'six': 6 // to pieza
};

const unitTypes: Record<string, string> = {
    'kg': 'mass', 'g': 'mass', 'lb': 'mass', 'oz': 'mass',
    'litro': 'volume', 'ml': 'volume', 'galon': 'volume',
    'pieza': 'count', 'docena': 'count', 'six': 'count'
};

export const RecipesPage: React.FC = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    const [newRecipe, setNewRecipe] = useState({
        name: '',
        description: '',
        preparation_time_minutes: '',
        sale_price: '',
        image_url: '',
        ingredients: [] as { ingredient_id: number; quantity: number; name: string; cost: number; unit: string }[]
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const [selectedIngId, setSelectedIngId] = useState<string>("");
    const [selectedQty, setSelectedQty] = useState<string>("");
    const [selectedUnit, setSelectedUnit] = useState<string>("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [recRes, ingRes] = await Promise.all([getRecipes(), getIngredients()]);
            setRecipes(recRes.data);
            setIngredients(ingRes.data.map((i: any) => ({
                ...i,
                cost_per_unit: Number(i.cost_per_unit)
            })));
        } catch (error) {
            console.error(error);
        }
    };

    const resetForm = () => {
        setNewRecipe({ name: '', description: '', preparation_time_minutes: '', sale_price: '', image_url: '', ingredients: [] });
        setSelectedImage(null);
        setIsEditing(false);
        setEditId(null);
        setShowForm(false);
        setSelectedIngId("");
        setSelectedQty("");
        setSelectedUnit("");
    };

    const handleEdit = (recipe: Recipe) => {
        // When editing, we need to load the full recipe details including ingredients
        // Since the list might not have ingredients, we might need to fetch details if not present
        // For now assuming the list has what we need or we fetch it. 
        // The current getRecipes returns list, getRecipeById returns details.
        // Let's fetch details to be safe.
        // But for this implementation, I'll assume we can just map what we have or fetch.
        // Ideally, we should fetch the single recipe details.
        // Let's do a quick fetch of the single recipe to get its ingredients.
        // Wait, I can't await inside this sync handler easily without making it async.
        // I'll make a helper.
        fetchAndSetEdit(recipe.id);
    };

    const fetchAndSetEdit = async (id: number) => {
        try {
            const res = await getRecipeById(id);
            const recipe = res.data;

            setNewRecipe({
                name: recipe.name,
                description: recipe.description || '',
                preparation_time_minutes: recipe.preparation_time_minutes.toString(),
                sale_price: recipe.sale_price.toString(),
                image_url: recipe.image_url || '',
                ingredients: recipe.ingredients.map((ri: any) => ({
                    ingredient_id: ri.ingredient_id, // Correctly map ingredient_id
                    quantity: Number(ri.quantity),
                    name: ri.name,
                    cost: Number(ri.cost_contribution),
                    unit: ri.unit // This is the unit stored in DB (base unit usually)
                }))
            });
            setEditId(id);
            setIsEditing(true);
            setShowForm(true);
        } catch (error) {
            console.error("Failed to fetch recipe details", error);
        }
    };

    const getAvailableUnits = (baseUnit: string) => {
        const type = unitTypes[baseUnit];
        if (!type) return [baseUnit];
        return Object.keys(unitTypes).filter(u => unitTypes[u] === type);
    };

    const addIngredientToRecipe = () => {
        const ingId = parseInt(selectedIngId);
        const qty = parseFloat(selectedQty);
        const ingredient = ingredients.find(i => i.id === ingId);

        if (ingredient && qty > 0) {
            // Calculate cost based on conversion
            let cost = 0;
            const baseUnit = ingredient.unit;
            const targetUnit = selectedUnit || baseUnit;

            // Check if compatible
            if (unitTypes[baseUnit] !== unitTypes[targetUnit]) {
                alert(`No se puede convertir de ${baseUnit} a ${targetUnit}`);
                return;
            }

            const baseFactor = unitConversions[baseUnit];
            const targetFactor = unitConversions[targetUnit];

            // Cost per base unit * (quantity in target * targetFactor / baseFactor)
            // Example: Cost is $10/kg. We use 500g.
            // base: kg (1000), target: g (1).
            // Qty in base units = 500 * 1 / 1000 = 0.5 kg.
            // Cost = 10 * 0.5 = 5.

            const quantityInBaseUnits = qty * targetFactor / baseFactor;
            cost = ingredient.cost_per_unit * quantityInBaseUnits;

            setNewRecipe({
                ...newRecipe,
                ingredients: [
                    ...newRecipe.ingredients,
                    {
                        ingredient_id: ingId,
                        quantity: quantityInBaseUnits,
                        name: ingredient.name,
                        cost: cost,
                        unit: baseUnit // We store in base unit
                    }
                ]
            });
            setSelectedIngId("");
            setSelectedQty("");
            setSelectedUnit("");
        }
    };

    const removeIngredientFromRecipe = (index: number) => {
        const updated = [...newRecipe.ingredients];
        updated.splice(index, 1);
        setNewRecipe({ ...newRecipe, ingredients: updated });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedImage(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', newRecipe.name);
            formData.append('description', newRecipe.description);
            formData.append('preparation_time_minutes', newRecipe.preparation_time_minutes);
            formData.append('sale_price', newRecipe.sale_price);
            formData.append('ingredients', JSON.stringify(newRecipe.ingredients));

            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            if (isEditing && editId) {
                await updateRecipe(editId, formData);
            } else {
                await createRecipe(formData);
            }

            resetForm();
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    const estimatedCost = newRecipe.ingredients.reduce((acc, curr) => acc + curr.cost, 0);

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Recetas</h1>
                    <p className="mt-1 text-gray-500">Gestiona tus platillos y calcula costos.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm); }}
                    className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {showForm ? 'Cerrar Formulario' : 'Nueva Receta'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden mb-10 animate-fade-in-down">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">{isEditing ? 'Editar Receta' : 'Crear Nueva Receta'}</h2>
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-500">
                            <span className="sr-only">Cerrar</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 md:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Basic Info */}
                            <div className="lg:col-span-1 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Platillo</label>
                                    <input
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                                        value={newRecipe.name}
                                        onChange={e => setNewRecipe({ ...newRecipe, name: e.target.value })}
                                        required
                                        placeholder="Ej. Hamburguesa Especial"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                    <textarea
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                                        rows={3}
                                        value={newRecipe.description}
                                        onChange={e => setNewRecipe({ ...newRecipe, description: e.target.value })}
                                        placeholder="Breve descripción..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Platillo</label>
                                    {newRecipe.image_url && (
                                        <div className="mb-2">
                                            <img src={newRecipe.image_url} alt="Current" className="h-32 w-full object-cover rounded-lg border border-gray-200" />
                                            <p className="text-xs text-gray-500 mt-1">Imagen actual</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo (min)</label>
                                        <div className="relative rounded-md shadow-sm">
                                            <input
                                                type="number"
                                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={newRecipe.preparation_time_minutes}
                                                onChange={e => setNewRecipe({ ...newRecipe, preparation_time_minutes: e.target.value })}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta</label>
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 sm:text-sm">$</span>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="block w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={newRecipe.sale_price}
                                                onChange={e => setNewRecipe({ ...newRecipe, sale_price: e.target.value })}
                                                required
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Ingredients */}
                            <div className="lg:col-span-2 bg-gray-50 rounded-xl border border-gray-200 p-6 flex flex-col">
                                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 001-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                                    </svg>
                                    Ingredientes y Costos
                                </h3>

                                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                    <div className="flex-1">
                                        <select
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={selectedIngId}
                                            onChange={e => {
                                                setSelectedIngId(e.target.value);
                                                const ing = ingredients.find(i => i.id === parseInt(e.target.value));
                                                if (ing) setSelectedUnit(ing.unit);
                                            }}
                                        >
                                            <option value="">Seleccionar ingrediente...</option>
                                            {ingredients.map(ing => (
                                                <option key={ing.id} value={ing.id}>{ing.name} (${Number(ing.cost_per_unit).toFixed(2)} / {ing.unit})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            step="0.001"
                                            className="block w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="Cant."
                                            value={selectedQty}
                                            onChange={e => setSelectedQty(e.target.value)}
                                        />

                                        {selectedIngId && (
                                            <select
                                                className="block w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                value={selectedUnit}
                                                onChange={e => setSelectedUnit(e.target.value)}
                                            >
                                                {getAvailableUnits(ingredients.find(i => i.id === parseInt(selectedIngId))?.unit || '').map(u => (
                                                    <option key={u} value={u}>{u}</option>
                                                ))}
                                            </select>
                                        )}

                                        <button
                                            type="button"
                                            onClick={addIngredientToRecipe}
                                            disabled={!selectedIngId || !selectedQty}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
                                    <div className="overflow-y-auto flex-1 p-0 max-h-[300px]">
                                        {newRecipe.ingredients.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                </svg>
                                                <p className="text-sm">Agrega ingredientes para calcular el costo</p>
                                            </div>
                                        ) : (
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingrediente</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cant.</th>
                                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                                                        <th scope="col" className="relative px-4 py-3"><span className="sr-only">Eliminar</span></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {newRecipe.ingredients.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{Number(item.quantity).toFixed(3)} {item.unit}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">${Number(item.cost).toFixed(2)}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                                <button onClick={() => removeIngredientFromRecipe(idx)} className="text-red-400 hover:text-red-600">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-500">Costo Total de Insumos:</span>
                                            <span className="text-lg font-bold text-gray-900">${estimatedCost.toFixed(2)}</span>
                                        </div>
                                        {newRecipe.sale_price && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500">Margen Estimado:</span>
                                                <span className={`text-sm font-bold ${((parseFloat(newRecipe.sale_price) - estimatedCost) / parseFloat(newRecipe.sale_price)) * 100 >= 30 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {((parseFloat(newRecipe.sale_price) - estimatedCost) / parseFloat(newRecipe.sale_price) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {isEditing ? 'Actualizar Receta' : 'Guardar Receta'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {recipes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay recetas</h3>
                    <p className="mt-1 text-sm text-gray-500">Comienza creando tu primera receta.</p>
                    <div className="mt-6">
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Nueva Receta
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {recipes.map(rec => (
                        <div key={rec.id} className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden flex flex-col">
                            <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                                {rec.image_url ? (
                                    <img src={rec.image_url} alt={rec.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl text-white opacity-30 font-bold select-none">
                                        {rec.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                                <button
                                    onClick={() => handleEdit(rec)}
                                    className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                                    title="Editar receta"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{rec.name}</h3>
                                </div>

                                <div className="mt-auto space-y-3 pt-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Costo</span>
                                        <span className="font-medium text-gray-900">${Number(rec.total_cost).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Precio</span>
                                        <span className="font-medium text-gray-900">${Number(rec.sale_price).toFixed(2)}</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${Number(rec.profit_margin) >= 30 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {Number(rec.profit_margin).toFixed(0)}% Margen
                                        </div>
                                        <span className="text-lg font-bold text-gray-900">${(rec.sale_price - rec.total_cost).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
