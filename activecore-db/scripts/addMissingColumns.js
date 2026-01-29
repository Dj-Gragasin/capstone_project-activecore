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

async function addMissingColumns() {
  try {
    console.log('🔄 Adding missing columns to meal_plans table...\n');
    
    // Add preference_id column if it doesn't exist
    await pool.query(`
      ALTER TABLE meal_plans
      ADD COLUMN IF NOT EXISTS preference_id INT REFERENCES user_meal_preferences(id) ON DELETE SET NULL
    `);
    
    console.log('✅ meal_plans table updated successfully!');
    console.log('✅ Added columns:');
    console.log('  - preference_id (nullable foreign key to user_meal_preferences)');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
}

addMissingColumns();
