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
