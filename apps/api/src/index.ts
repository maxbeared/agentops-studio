import { config } from 'dotenv';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/auth';
import { projectRoutes } from './routes/projects';
import { knowledgeRoutes } from './routes/knowledge';
import { workflowRoutes } from './routes/workflows';
import { runRoutes } from './routes/runs';
import { reviewRoutes } from './routes/reviews';
import { dashboardRoutes } from './routes/dashboard';
import { promptRoutes } from './routes/prompts';

config({ path: '../../.env' });

const app = new Hono();

app.use('*', cors());
app.use('*', logger());

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'api' });
});

app.route('/auth', authRoutes);
app.route('/projects', projectRoutes);
app.route('/knowledge', knowledgeRoutes);
app.route('/workflows', workflowRoutes);
app.route('/runs', runRoutes);
app.route('/reviews', reviewRoutes);
app.route('/dashboard', dashboardRoutes);
app.route('/prompts', promptRoutes);

const port = Number(process.env.API_PORT || 3001);

export default {
  port,
  fetch: app.fetch,
};
