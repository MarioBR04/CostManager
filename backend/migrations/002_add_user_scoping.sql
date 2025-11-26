-- Add user_id to ingredients
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id);

-- Add user_id and image_url to recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Assign existing data to the first user (if any exists) to avoid data loss/orphaned records
DO $$
DECLARE
    first_user_id INT;
BEGIN
    SELECT id INTO first_user_id FROM users ORDER BY id LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        UPDATE ingredients SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE recipes SET user_id = first_user_id WHERE user_id IS NULL;
    END IF;
END $$;
