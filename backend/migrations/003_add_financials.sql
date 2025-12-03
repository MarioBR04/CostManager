-- Financial Periods table (Monthly records)
CREATE TABLE IF NOT EXISTS financial_periods (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    period_date DATE NOT NULL, -- First day of the month (e.g., 2023-11-01)
    
    -- Fixed Costs
    payroll DECIMAL(10, 2) DEFAULT 0, -- Nomina
    rent DECIMAL(10, 2) DEFAULT 0,    -- Renta (if applicable)
    utilities DECIMAL(10, 2) DEFAULT 0, -- Gas, Luz, Agua combined or separate? Let's keep it simple or allow breakdown
    other_fixed_costs DECIMAL(10, 2) DEFAULT 0,
    
    -- Sales
    total_sales DECIMAL(10, 2) DEFAULT 0,
    
    -- Calculated/Snapshot fields (optional, but good for history)
    calculated_break_even_point DECIMAL(10, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, period_date) -- One record per month per user
);
