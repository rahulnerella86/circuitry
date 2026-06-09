const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables
try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch (e) { /* dotenv optional */ }

const circuitRoutes = require('./routes/circuit');
const projectRoutes = require('./routes/projects');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const corsOptions = {
  origin: corsOrigin.split(',').map(o => o.trim()),
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api', circuitRoutes);
app.use('/api/projects', projectRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  res.json({
    status: 'ok',
    version: '3.0.0',
    engine: 'rule-based',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`\n⚡ Circuit Generator API Server running on http://localhost:${PORT}`);
    console.log(`   ───────────────────────────────────────────`);
    console.log(`   Generate:  POST /api/generate`);
    console.log(`   Projects:  CRUD /api/projects`);
    console.log(`   ───────────────────────────────────────────\n`);
  });
}

module.exports = app;
