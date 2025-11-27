// api/simulate.js
require('dotenv').config();
const pool = require('./config/db');
const WebSocket = require('ws');

console.log('Simulator started');

const wss = new WebSocket.Server({ port: 8080 }, () => {
  console.log('WebSocket server running on ws://localhost:8080');
});

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

async function moveRobots() {
  try {
    const res = await pool.query('SELECT * FROM robots');
    const robots = [];

    for (const robot of res.rows) {
      const deltaLat = (Math.random() - 0.5) / 5;
      const deltaLon = (Math.random() - 0.5) / 5;
      const newLat = robot.lat + deltaLat;
      const newLon = robot.lon + deltaLon;

      await pool.query(
        'UPDATE robots SET lat=$1, lon=$2, status=$3, updated_at=NOW() WHERE id=$4',
        [newLat, newLon, 'moving', robot.id]
      );

      robots.push({
        id: robot.id,
        name: robot.name,
        lat: newLat,
        lon: newLon,
        status: 'moving',
      });
    }

    console.log('Broadcasting', robots.length, 'robots');
    broadcast(robots);
  } catch (err) {
    console.error('Error moving robots:', err);
  }
}

// State: starts as null (not running)
let simulationInterval = null;

// Export an object with both state and control functions
module.exports = {
  moveRobots,
  isRunning() {
    return simulationInterval !== null;
  },
  startSimulation() {
    if (simulationInterval !== null) {
      console.log('Simulation already running');
      return false; // already running
    }
    console.log('Starting simulation');
    simulationInterval = setInterval(moveRobots, 2000);
    return true;
  },
  stopSimulation() {
    if (simulationInterval === null) {
      console.log('Simulation not running');
      return false; // not running
    }
    console.log('Stopping simulation');
    clearInterval(simulationInterval);
    simulationInterval = null;
    return true;
  },
};
