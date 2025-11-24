// Type definitions for application
import type { VerifyFirebaseAuthEnv } from '@hono/firebase-auth';

export interface AppVersion {
  id: number;
  version: string;
  release_date: string;
  description: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// Extend VerifyFirebaseAuthEnv to include our custom bindings
export type Bindings = VerifyFirebaseAuthEnv & {
  DataBase: D1Database;
};

export interface CreateVersionRequest {
  version: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateVersionRequest {
  version?: string;
  description?: string;
  is_active?: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
}

