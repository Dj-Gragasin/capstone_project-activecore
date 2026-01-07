const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'activecore',
  ssl: process.env.DB_HOST?.includes('render.com') ? { rejectUnauthorized: false } : false,
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
