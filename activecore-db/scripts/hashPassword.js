const bcrypt = require('bcryptjs');

async function generateHash() {
  const hash = await bcrypt.hash('password', 10);
  console.log('Bcrypt hash for "password":', hash);
}

generateHash();
