import express from 'express';
import cors from 'cors';
import { loadSettings } from './config/config';
import { UserStore } from './storage/userStore';
import { ProjectStore } from './storage/projectStore';
import { buildRouter } from './api/routes';

async function startServer() {
  const settings = loadSettings();
  const userStore = new UserStore(settings.supabaseUrl, settings.supabaseKey, settings.supabaseSchema);
  const projectStore = new ProjectStore(settings.supabaseUrl, settings.supabaseKey, settings.supabaseSchema);
  await userStore.init();

  const app = express();

  app.use(cors({
    origin: settings.corsOrigins,
    credentials: true,
  }));

  app.use(express.json());

  app.use(buildRouter(userStore, projectStore, settings.authSecret, settings.accessTokenTtlMinutes));

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Authentication Service (Node.js) listening on port ${port}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
