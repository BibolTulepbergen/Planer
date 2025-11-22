import type { MiddlewareHandler } from 'hono';

// Logger middleware for request/response logging
export const logger = (): MiddlewareHandler => {
  return async (c, next) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;

    await next();

    const end = Date.now();
    const status = c.res.status;
    const duration = end - start;

    console.log(`[${method}] ${path} - ${status} (${duration}ms)`);
  };
};

