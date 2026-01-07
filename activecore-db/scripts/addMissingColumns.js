const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'activecore',
  ssl: process.env.DB_HOST?.includes('render.com') ? { rejectUnauthorized: false } : false,
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
