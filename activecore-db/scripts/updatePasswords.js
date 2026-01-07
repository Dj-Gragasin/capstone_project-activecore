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
