import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import versions from './routes/versions';
import type { Bindings } from './types';

// Initialize Hono app
const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Simple test endpoint for Postman
app.get('/api/test', (c) => {
  return c.json({
    name: 'Егор',
    connection: true,
  });
});

// Mount version routes
app.route('/api', versions);

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
