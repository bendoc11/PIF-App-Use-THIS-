import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.playitforward.basketball',
  appName: 'Play It Forward',
  webDir: 'dist',
  server: {
    url: 'https://playitforward.app',
    cleartext: false
  }
};

export default config;
