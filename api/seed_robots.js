// seed_robots.js
require('dotenv').config();
const pool = require('./config/db');

async function seedRobots() {
 const robots = [
  { name: 'Robot A', status: 'idle', lat: 51.5, lon: -0.12 },   // London
  { name: 'Robot B', status: 'moving', lat: 48.85, lon: 2.35 },  // Paris
  { name: 'Robot C', status: 'idle', lat: 40.71, lon: -74.0 }    // New York
];

  try {
    for (const robot of robots) {
      await pool.query(
        `INSERT INTO robots (name, status, lat, lon)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [robot.name, robot.status, robot.lat, robot.lon]
      );
    }
    console.log('Sample robots seeded ✅');
  } catch (err) {
    console.error('Error seeding robots:', err);
  } finally {
    pool.end();
  }
}

seedRobots();
