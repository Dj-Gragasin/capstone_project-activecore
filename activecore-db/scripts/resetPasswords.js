const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
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

async function resetPasswords() {
  try {
    console.log('🔄 Resetting test account passwords...\n');
    
    // Hash password 'password'
    const hashedPassword = await bcrypt.hash('password', 10);
    console.log('Generated bcrypt hash for password "password"');
    console.log('Hash:', hashedPassword);
    console.log('');
    
    // Update admin account
    await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, 'admin@activecore.com']
    );
    console.log('✅ Updated admin@activecore.com password');
    
    // Update member account
    await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, 'member@activecore.com']
    );
    console.log('✅ Updated member@activecore.com password');
    
    console.log('\n📋 Test credentials:');
    console.log('  Admin:  admin@activecore.com / password');
    console.log('  Member: member@activecore.com / password');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Password reset failed:', error.message);
    process.exit(1);
  }
}

resetPasswords();
