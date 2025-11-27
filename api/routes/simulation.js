// api/routes/simulation.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const simulator = require('../simulate');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

router.post('/start', authMiddleware, (req, res) => {
  const success = simulator.startSimulation();
  if (success) {
    return res.json({ message: 'Simulation started', running: true });
  }
  res.status(400).json({ message: 'Simulation already running', running: true });
});

router.post('/stop', authMiddleware, (req, res) => {
  const success = simulator.stopSimulation();
  if (success) {
    return res.json({ message: 'Simulation stopped', running: false });
  }
  res.status(400).json({ message: 'Simulation is not running', running: false });
});

module.exports = router;
