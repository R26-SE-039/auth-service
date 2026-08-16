import express from 'express';
import cors from 'cors';
import { loadSettings } from './config/config';
import { buildAuthRouter } from './routes/auth.routes';
import { buildOrganizationRouter } from './routes/organization.routes';
import { buildProjectRouter } from './routes/project.routes';
import { buildProjectMemberRouter } from './routes/project-member.routes';
import { buildUserRouter } from './routes/user.routes';
import { buildIterationRouter } from './routes/iteration.routes';
import { buildProjectConfigurationRouter } from './routes/project-configuration.routes';
import { pool } from './config/database';
import { errorHandler } from './middleware/error';

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

  // Mount API Routers
  app.use('/auth', buildAuthRouter());
  app.use('/organizations', buildOrganizationRouter());
  app.use('/projects', buildProjectRouter());
  app.use('/project-members', buildProjectMemberRouter());
  app.use('/users', buildUserRouter());
  app.use('/projects/:projectId/iterations', buildIterationRouter());
  app.use('/projects/:projectId/configuration', buildProjectConfigurationRouter());

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Global Error Handler
  app.use(errorHandler);

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Authentication Service (Node.js/PostgreSQL) listening on port ${port}`);
  });
}

// Trigger reload for Neon DB migration
startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
