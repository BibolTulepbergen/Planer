import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.planer.app',
  appName: 'planer',
  webDir: 'dist/client',
  // server: {
  //   url: 'https://planer.moldahasank.workers.dev',
  //   androidScheme: 'https'
  // },
plugins: {
  "edge-to-edge": {
    "backgroundColor": "#ffffff"
  }
}
};

export default config;

