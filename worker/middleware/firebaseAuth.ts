import type { VerifyFirebaseAuthConfig } from '@hono/firebase-auth';
import { verifyFirebaseAuth, getFirebaseToken } from '@hono/firebase-auth';
import type { MiddlewareHandler } from 'hono';

// Firebase project ID
const FIREBASE_PROJECT_ID = 'planer-3e65e';

// Firebase Auth configuration
const config: VerifyFirebaseAuthConfig = {
  projectId: FIREBASE_PROJECT_ID,
};

/**
 * Firebase Authentication middleware with email verification check
 * Verifies JWT tokens and checks if email is verified
 */
export const firebaseAuth = (): MiddlewareHandler => {
  return async (c, next) => {
    // First verify the Firebase token
    try {
      await verifyFirebaseAuth(config)(c, async () => {});
    } catch (error) {
      return c.json(
        {
          success: false,
          error: 'Authentication required',
        },
        401
      );
    }

    // After token verification, check if email is verified
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

    // Check if email is verified
    if (!token.email_verified) {
      return c.json(
        {
          success: false,
          error: 'Email verification required. Please verify your email address.',
        },
        403
      );
    }

    // Email is verified, proceed with the request
    await next();
  };
};

