const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'activecore',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function deleteRecipesFrom27() {
  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    console.log('📊 Checking current recipe count...');
    const [countBefore] = await connection.execute('SELECT COUNT(*) as total FROM filipino_dishes');
    console.log(`📈 Total recipes before deletion: ${countBefore[0].total}`);
    
    console.log('🗑️  Deleting recipes with id >= 27...');
    const [result] = await connection.execute('DELETE FROM filipino_dishes WHERE id >= 27');
    
    console.log(`✅ Deleted ${result.affectedRows} recipes`);
    
    const [countAfter] = await connection.execute('SELECT COUNT(*) as total FROM filipino_dishes');
    console.log(`📈 Total recipes after deletion: ${countAfter[0].total}`);
    
    console.log('\n✨ Successfully removed recipes from #27 onwards');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

deleteRecipesFrom27();
