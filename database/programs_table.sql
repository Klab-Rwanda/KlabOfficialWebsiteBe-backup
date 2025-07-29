-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image TEXT NOT NULL,
    description TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_programs_name ON programs(name);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_programs_created_at ON programs(created_at);

-- Add comment to table
COMMENT ON TABLE programs IS 'Stores program information including name, image, description, and details'; 