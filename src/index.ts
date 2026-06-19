import express from 'express';
import cors from 'cors';
import { loadSettings } from './config/config';
import { buildAuthRouter } from './routes/auth.routes';
import { pool } from './config/database';

async function startServer() {
  const settings = loadSettings();

  // Test database connection
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL database at:', res.rows[0].now);
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }

  const app = express();

  app.use(cors({
    origin: settings.corsOrigins,
    credentials: true,
  }));

  app.use(express.json());

  app.use('/auth', buildAuthRouter());

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Authentication Service (Node.js/PostgreSQL) listening on port ${port}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
