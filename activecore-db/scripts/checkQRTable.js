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

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...\n');
    
    // Check if qr_attendance_tokens table exists
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'qr_attendance_tokens'
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ qr_attendance_tokens table does NOT exist!');
      console.log('Creating table now...\n');
      
      await pool.query(`
        CREATE TABLE qr_attendance_tokens (
          id SERIAL PRIMARY KEY,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id)
        );
        
        CREATE INDEX idx_qr_token ON qr_attendance_tokens(token);
        CREATE INDEX idx_qr_expires ON qr_attendance_tokens(expires_at);
      `);
      
      console.log('✅ qr_attendance_tokens table created!');
    } else {
      console.log('✅ qr_attendance_tokens table exists with columns:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();
