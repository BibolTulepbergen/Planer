import { HTTPException } from 'hono/http-exception';
import type { ErrorHandler } from 'hono';
import type { ApiResponse } from '../types';

// Global error handler
export const errorHandler: ErrorHandler = (err, c) => {
  console.error('Error occurred:', err);

  if (err instanceof HTTPException) {
    return c.json<ApiResponse>(
      {
        success: false,
        error: err.message,
      },
      err.status
    );
  }

  return c.json<ApiResponse>(
    {
      success: false,
      error: err.message || 'Internal Server Error',
    },
    500
  );
};

