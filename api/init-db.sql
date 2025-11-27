CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS robots (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'idle',
  lat DECIMAL(10, 6) NOT NULL,
  lon DECIMAL(10, 6) NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample user
INSERT INTO users (email, password_hash) 
VALUES ('admin@test.com', '$2b$10$YixjauVWZWt8.vgfb8A8.uHWzx7KfxNt3j7DvH5s4O5s9p8A8p7Ym')
ON CONFLICT (email) DO NOTHING;

-- Insert sample robots
INSERT INTO robots (name, status, lat, lon) VALUES
('Robot-1', 'idle', 48.8566, 2.3522),
('Robot-2', 'idle', 40.7128, -74.0060),
('Robot-3', 'idle', 35.6762, 139.6503),
('Robot-4', 'idle', -33.8688, 151.2093)
ON CONFLICT DO NOTHING;
