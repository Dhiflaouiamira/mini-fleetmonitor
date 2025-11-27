// seed.js
require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcrypt');

async function seedUser() {
  const email = 'admin@test.com';
  const password = 'test123';
  const password_hash = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      `INSERT INTO users (email, password_hash) 
       VALUES ($1, $2) 
       ON CONFLICT (email) DO NOTHING`,
      [email, password_hash]
    );
    console.log('Admin user seeded ✅');
  } catch (err) {
    console.error('Error seeding user:', err);
  } finally {
    pool.end();
  }
}

seedUser();
