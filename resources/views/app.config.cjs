const path = require('path');
const dotenv = require('dotenv');
const {
  trim,
  resolveFromRoot,
  buildPlugins,
  buildExtra,
} = require('./app.config.helpers.cjs');

const rootDir = path.join(__dirname, '..', '..');
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(rootDir, '.env') });

const env = process.env;

const iosGoogleServices = resolveFromRoot(rootDir, env.IOS_GOOGLE_SERVICES_FILE);
const androidGoogleServices = resolveFromRoot(rootDir, env.ANDROID_GOOGLE_SERVICES_FILE);

module.exports = {
  expo: {
    name: trim(env.EXPO_PUBLIC_APP_NAME) || 'Zevota Care',
    slug: trim(env.EXPO_PUBLIC_APP_SLUG) || 'zevota-care',
    version: trim(env.EXPO_PUBLIC_APP_VERSION) || '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: trim(env.EXPO_PUBLIC_APP_SCHEME) || 'zevotacare',
    splash: {
      image: './assets/splash-screen.png',
      resizeMode: 'cover',
      backgroundColor: '#2563eb',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: trim(env.IOS_BUNDLE_IDENTIFIER) || 'com.zevota.care',
      ...(iosGoogleServices ? { googleServicesFile: iosGoogleServices } : {}),
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#2563eb',
      },
      package: trim(env.ANDROID_PACKAGE) || 'com.zevota.care',
      ...(androidGoogleServices ? { googleServicesFile: androidGoogleServices } : {}),
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/favicon.png',
    },
    experiments: {
      baseUrl: '/',
    },
    plugins: buildPlugins(env),
    extra: buildExtra(env),
  },
};
