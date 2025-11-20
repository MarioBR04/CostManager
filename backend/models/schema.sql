-- Users table (simplified for MVP)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ingredients table (Insumos)
CREATE TABLE IF NOT EXISTS ingredients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- kg, liter, unit, etc.
    cost_per_unit DECIMAL(10, 2) NOT NULL,
    supplier VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipes table (Recetas)
CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    preparation_time_minutes INT,
    total_cost DECIMAL(10, 2) DEFAULT 0, -- Calculated Food Cost
    sale_price DECIMAL(10, 2),
    profit_margin DECIMAL(5, 2), -- Percentage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipe Ingredients (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id INT REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id INT REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity DECIMAL(10, 3) NOT NULL, -- Amount of ingredient used
    cost_contribution DECIMAL(10, 2) NOT NULL -- Calculated cost for this amount
);

-- Gamification / Scores
CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    points INT DEFAULT 0,
    level VARCHAR(50) DEFAULT 'Novice',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
