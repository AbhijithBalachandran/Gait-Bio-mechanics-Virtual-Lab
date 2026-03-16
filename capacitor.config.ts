// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kinetrax.learn',
  appName: 'KinetraxLearn',
  webDir: 'build',
  server: {
    androidScheme: 'https',
  },
};

export default config;
