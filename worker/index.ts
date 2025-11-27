import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import versions from './routes/versions';
import tasks from './routes/tasks';
import tags from './routes/tags';
import type { Bindings } from './types';

// Initialize Hono app with Bindings for environment
const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Public test endpoint (no auth required)
app.get('/api/test', (c) => {
  return c.json({
    name: 'Planer API',
    connection: true,
    message: 'Public endpoint - no authentication required',
  });
});

// Mount routes
app.route('/api', versions);
app.route('/api/tasks', tasks);
app.route('/api/tags', tags);

// 404 handler for undefined routes
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Endpoint not found',
    },
    404
  );
});

// Global error handler
app.onError(errorHandler);

export default app;
