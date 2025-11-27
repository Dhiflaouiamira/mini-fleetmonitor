// api/routes/robots.js
const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const jwt = require('jsonwebtoken');
const redis = require('redis');

// Initialize Redis client
const redisClient = redis.createClient({ url: 'redis://redis:6379' });
redisClient.connect().catch(err => console.error('Redis connection error:', err));

// Auth middleware
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

// Get all robots WITH CACHE
router.get('/', authMiddleware, async (req, res) => {
  try {
    const cacheKey = 'robots:all';
    
    // Try to get from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log('✅ Serving robots from cache');
      return res.json(JSON.parse(cached));
    }
    
    // Not in cache, query database
    console.log('📊 Querying robots from database');
    const result = await pool.query('SELECT * FROM robots ORDER BY id');
    
    // Store in Redis with 10-second expiration
    await redisClient.set(cacheKey, JSON.stringify(result.rows), { EX: 10 });
    
    res.json(result.rows);
  } catch (err) {
    console.error('GET robots error:', err);
    res.status(500).json({ error: 'Failed to fetch robots' });
  }
});

// Add new robot
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { name, status, lat, lon } = req.body;
    if (!name || lat === undefined || lon === undefined)
      return res.status(400).json({ error: 'name, lat, and lon are required' });

    const result = await pool.query(
      'INSERT INTO robots (name, status, lat, lon) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, status || 'idle', lat, lon]
    );
    
    // Invalidate cache when adding robot
    await redisClient.del('robots:all');
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Add robot error:', err);
    res.status(500).json({ error: 'Failed to add robot' });
  }
});

// Move single robot (random movement)
router.post('/:id/move', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const moveQuery = `
      UPDATE robots
      SET
        lat = lat + (random() - 0.5) * 0.01,
        lon = lon + (random() - 0.5) * 0.01,
        status = 'moving',
        updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    
    const result = await pool.query(moveQuery, [id]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Robot not found' });
    }
    
    // Invalidate cache when moving robot
    await redisClient.del('robots:all');
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Move robot error:', err);
    res.status(500).json({ error: 'Failed to move robot' });
  }
});

// Delete robot
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM robots WHERE id=$1', [id]);
    
    // Invalidate cache when deleting robot
    await redisClient.del('robots:all');
    
    res.json({ success: true });
  } catch (err) {
    console.error('Delete robot error:', err);
    res.status(500).json({ error: 'Failed to delete robot' });
  }
});

module.exports = router;
