-- init.sql

-- Create robots table
CREATE TABLE IF NOT EXISTS robots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'idle',
    lat DECIMAL(10,7),
    lon DECIMAL(10,7)
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

-- Seed admin user (password: test123)
-- bcrypt hash for 'test123' using 10 salt rounds
INSERT INTO users (email, password_hash) VALUES
('admin@test.com', '$2b$10$c2KWPaFRj7cf/iDpTBg1qOxCCEwOzYq64cwwGQ0F0RI7z4oRg7MNe') 
ON CONFLICT (email) DO NOTHING;
