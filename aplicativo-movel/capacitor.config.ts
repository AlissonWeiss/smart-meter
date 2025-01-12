import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.weiss.smart.meter.monitor',
  appName: 'SmartMeter-Monitor',
  webDir: 'www',
  server: {
    androidScheme: 'http',
    allowNavigation: ['*']
  },
  android: {
    includePlugins: [
      '@capacitor/app',
      '@capacitor-mlkit/barcode-scanning',
      '@capacitor/device',
      '@capawesome-team/capacitor-android-foreground-service',
      '@capawesome/capacitor-background-task',
      '@capacitor/local-notifications',
      '@capacitor/background-runner'
    ]
  },
  plugins: {
  }
};

export default config;
