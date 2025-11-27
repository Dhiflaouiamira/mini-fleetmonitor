// api/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Import routes
const authRoute = require('./routes/auth');
app.use('/auth', authRoute);

const robotsRoute = require('./routes/robots');
app.use('/robots', robotsRoute);

const simulationRoute = require('./routes/simulation');
app.use('/simulation', simulationRoute);

// Start simulator
require('./simulate');

app.get('/', (req, res) => res.send('API is running 🚀'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
