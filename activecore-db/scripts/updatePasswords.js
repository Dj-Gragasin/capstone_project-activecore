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

async function updatePasswords() {
  try {
    console.log('🔄 Updating test account passwords...\n');
    
    const validHash = '$2a$10$GAoJ1xEGbNxnF7dzmPkki.PXGK0ZLjTO1D.AlJf1pmqDavH0HzibS';
    
    await pool.query(
      'UPDATE users SET password = $1 WHERE email IN ($2, $3)',
      [validHash, 'admin@activecore.com', 'member@activecore.com']
    );
    
    console.log('✅ Password updated successfully!');
    console.log('\n📋 Login credentials:');
    console.log('  Email:    admin@activecore.com or member@activecore.com');
    console.log('  Password: password');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
}

updatePasswords();
