import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.planer.app',
  appName: 'planer',
  webDir: 'dist/client',
  server: {
    androidScheme: 'https'
  }
};

export default config;

