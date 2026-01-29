#!/usr/bin/env node
/**
 * Database Connection Test Script
 * Tests the PostgreSQL connection with detailed diagnostics
 */

const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('\n🔍 DATABASE CONNECTION DIAGNOSTIC TEST');
  console.log('═'.repeat(50));
  
  console.log('\n📋 Configuration:');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Port: ${process.env.DB_PORT || '5432'}`);
  console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
  console.log(`   Database: ${process.env.DB_NAME || 'activecore'}`);
  console.log(`   SSL: ${process.env.DB_HOST?.includes('render.com') ? 'enabled' : 'disabled'}`);

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
    connectionTimeoutMillis: 15000,
      ssl: sslConfig,
  });

  console.log('\n⏳ Attempting connection...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Connection successful!');
    
    // Test query
    console.log('\n📊 Running test query...');
    const result = await client.query('SELECT version()');
    console.log('✅ Query successful!');
    console.log(`   PostgreSQL: ${result.rows[0].version.split(',')[0]}`);
    
    // List tables
    console.log('\n📋 Database tables:');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (tables.rows.length === 0) {
      console.log('   ⚠️  No tables found - database is empty');
    } else {
      tables.rows.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.table_name}`);
      });
    }
    
    client.release();
    await pool.end();
    
    console.log('\n✅ All tests passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 This usually means:');
      console.error('   - Database server is not running');
      console.error('   - Host/port is incorrect');
      console.error('   - Firewall is blocking the connection');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n💡 This usually means:');
      console.error('   - Host name is incorrect or cannot be resolved');
      console.error('   - Network connectivity issue');
    } else if (error.code === 'FATAL') {
      console.error('\n💡 This usually means:');
      console.error('   - Invalid username/password');
      console.error('   - User does not have access to this database');
    }
    
    process.exit(1);
  }
}

testConnection();
