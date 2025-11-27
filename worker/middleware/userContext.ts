import type { MiddlewareHandler } from 'hono';
import { getFirebaseToken } from '@hono/firebase-auth';
import type { Bindings, Variables, User } from '../types';

/**
 * User context middleware
 * Gets or creates user in D1 based on Firebase UID
 * Adds user object to context for use in routes
 */
export const userContext = (): MiddlewareHandler<{ Bindings: Bindings; Variables: Variables }> => {
  return async (c, next) => {
    const token = getFirebaseToken(c);
    
    if (!token) {
      return c.json(
        {
          success: false,
          error: 'Authentication required',
        },
        401
      );
    }

    const db = c.env.DataBase;
    const { uid, email, name, picture, email_verified } = token;

    // Check if email is verified
    if (!email_verified) {
      return c.json(
        {
          success: false,
          error: 'Email verification required',
        },
        403
      );
    }

    try {
      // Try to find existing user
      let user = await db
        .prepare('SELECT * FROM users WHERE firebase_uid = ?')
        .bind(uid)
        .first<User>();

      // If user doesn't exist, create new one
      if (!user) {
        const result = await db
          .prepare(
            `INSERT INTO users (firebase_uid, email, display_name, photo_url, timezone, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'UTC', datetime('now'), datetime('now'))
             RETURNING *`
          )
          .bind(uid, email || null, name || null, picture || null)
          .first<User>();

        if (!result) {
          return c.json(
            {
              success: false,
              error: 'Failed to create user',
            },
            500
          );
        }

        user = result;
      } else {
        // Update user info if changed
        await db
          .prepare(
            `UPDATE users 
             SET email = ?, display_name = ?, photo_url = ?, updated_at = datetime('now')
             WHERE id = ?`
          )
          .bind(email || null, name || null, picture || null, user.id)
          .run();
      }

      // Add user to context
      c.set('user', user);

      await next();
    } catch (error) {
      console.error('User context error:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to get user context',
        },
        500
      );
    }
  };
};

