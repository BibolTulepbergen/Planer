import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development' || process.env.WRANGLER_ENV === 'dev';
  
  return {
    plugins: [
      react(), 
      cloudflare({
        configPath: './wrangler.jsonc',
        persistState: true,
        ...(isDev && { environment: 'dev' }),
      })
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8787',
          changeOrigin: true,
        }
      }
    }
  };
});