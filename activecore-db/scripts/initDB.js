const { Pool } = require('pg');
require('dotenv').config();

function parseBool(value, fallback) {
    if (value === undefined) return fallback;
    const normalized = String(value).trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
    return fallback;
}

const dbHost = process.env.DB_HOST || 'localhost';
const isLocalHost = dbHost === 'localhost' || dbHost === '127.0.0.1';
const shouldUseSSL = parseBool(process.env.DB_SSL, !isLocalHost);
const defaultRejectUnauthorized = dbHost.includes('render.com') ? false : true;
const sslRejectUnauthorized = parseBool(process.env.DB_SSL_REJECT_UNAUTHORIZED, defaultRejectUnauthorized);
const sslConfig = shouldUseSSL ? { rejectUnauthorized: sslRejectUnauthorized } : false;

const pool = new Pool({
    host: dbHost,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'activecore',
    ssl: sslConfig,
});

const initSQL = `
-- Drop existing tables (if exists, for clean reinstall)
DROP TABLE IF EXISTS user_rewards CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS qr_attendance_tokens CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    attendance_streak INT DEFAULT 0,
    last_attendance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    check_in_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    location VARCHAR(100) DEFAULT 'Main Gym',
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'late')),
    qr_token_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for attendance
CREATE INDEX idx_attendance_user_date ON attendance(user_id, check_in_time);
CREATE INDEX idx_attendance_date ON attendance(check_in_time);

-- Create QR Attendance Tokens table
CREATE TABLE qr_attendance_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create indexes for QR tokens
CREATE INDEX idx_qr_token ON qr_attendance_tokens(token);
CREATE INDEX idx_qr_expires ON qr_attendance_tokens(expires_at);

-- Create rewards table
CREATE TABLE rewards (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    required_attendance INT NOT NULL,
    points INT DEFAULT 0,
    category VARCHAR(20) DEFAULT 'product' CHECK (category IN ('product', 'service', 'discount')),
    icon VARCHAR(10) DEFAULT '🎁',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_rewards table (claimed rewards)
CREATE TABLE user_rewards (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    reward_id INT NOT NULL,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE,
    UNIQUE(user_id, reward_id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50),
    membership_type VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
    transaction_id VARCHAR(255) UNIQUE,
    subscription_start DATE,
    subscription_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert test users (password: bcrypt hash of 'password')
INSERT INTO users (email, password, first_name, last_name, role) VALUES 
('admin@activecore.com', '$2b$10$xJwq5rkqZ7QY5D8X9yZ9Z.9Y5D8X9yZ9Z.', 'Admin', 'User', 'admin'),
('member@activecore.com', '$2b$10$xJwq5rkqZ7QY5D8X9yZ9Z.9Y5D8X9yZ9Z.', 'Member', 'User', 'member');

-- Add missing columns to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_type VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_price DECIMAL(10, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS join_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255);

-- Insert default rewards
INSERT INTO rewards (title, description, required_attendance, points, category, icon) VALUES
('Free Protein Shake', 'Get a complimentary protein shake from our juice bar', 5, 10, 'product', '🥤'),
('Free Personal Training Session', 'One-on-one session with our certified trainers', 10, 50, 'service', '💪'),
('ActiveCore Water Bottle', 'Premium stainless steel water bottle', 15, 25, 'product', '🍶'),
('20% Off Supplements', 'Discount on all supplement products', 20, 30, 'discount', '💊'),
('Massage Therapy Session', '45-minute relaxation massage session', 25, 75, 'service', '💆'),
('ActiveCore Gym Bag', 'Premium branded gym bag with compartments', 30, 40, 'product', '🎒');

-- Create meal planning tables
CREATE TABLE IF NOT EXISTS user_meal_preferences (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meal_plans (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    plan_name VARCHAR(255),
    plan_data JSONB,
    exercise_focus VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    generated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS filipino_dishes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    calories INT,
    cal INT,
    protein DECIMAL(10,2),
    pro DECIMAL(10,2),
    carbs DECIMAL(10,2),
    carb DECIMAL(10,2),
    fats DECIMAL(10,2),
    fat DECIMAL(10,2),
    fiber DECIMAL(10,2),
    ingredients JSONB,
    recipe TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for meal planning
CREATE INDEX IF NOT EXISTS idx_user_meal_preferences ON user_meal_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_created ON meal_plans(created_at);
CREATE INDEX IF NOT EXISTS idx_dishes_category ON filipino_dishes(category);
CREATE INDEX IF NOT EXISTS idx_dishes_name ON filipino_dishes(name);
`;

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing PostgreSQL database...\n');
    
    await pool.query(initSQL);
    
    console.log('✅ Database initialized successfully!');
    console.log('\n📋 Test accounts created:');
    console.log('  Admin:  admin@activecore.com / password');
    console.log('  Member: member@activecore.com / password');
    console.log('\n💰 Rewards inserted: 6 default rewards');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
