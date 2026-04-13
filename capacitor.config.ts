import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.feehab.thedigitalarchitect',
  appName: 'The Digital Architect',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
