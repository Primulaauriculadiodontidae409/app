import { PerryConfig } from 'perry';

const config: PerryConfig = {
  name: 'Mango',
  identifier: 'com.skelpo.mango',
  version: '1.0.0',
  entry: 'src/app.ts',

  targets: {
    macos: {
      framework: 'AppKit',
      minimumVersion: '13.0',
      icon: 'logo/mango-app-icon-512.png',
      category: 'public.app-category.developer-tools',
    },
    ios: {
      framework: 'UIKit',
      minimumVersion: '16.0',
      icon: 'logo/mango-app-icon-512.png',
      supportedOrientations: ['portrait', 'landscape'],
    },
    android: {
      framework: 'Views',
      minimumSdk: 26,
      targetSdk: 34,
      icon: 'logo/mango-app-icon-512.png',
    },
    linux: {
      framework: 'GTK4',
      icon: 'logo/mango-app-icon-256.png',
    },
    windows: {
      framework: 'Win32',
      icon: 'logo/mango-app-icon-256.png',
    },
    web: {
      framework: 'DOM',
    },
  },

  build: {
    minify: true,
    sourceMaps: false,
    stripDebug: true,
  },

  permissions: {
    network: true,
    fileSystem: 'read-write',
    keychain: true,
  },
};

export default config;
