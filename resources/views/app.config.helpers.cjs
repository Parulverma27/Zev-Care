const fs = require('fs');
const path = require('path');

const trim = (v) => (v || '').trim();

function resolveFromRoot(rootDir, filePath) {
  if (!trim(filePath)) return null;
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.join(rootDir, filePath.replace(/^\.\//, ''));
  return fs.existsSync(resolved) ? filePath : null;
}

function isFirebaseEnabled(env) {
  return Boolean(
    trim(env.EXPO_PUBLIC_FIREBASE_API_KEY) &&
      trim(env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) &&
      trim(env.EXPO_PUBLIC_FIREBASE_APP_ID)
  );
}

function isGoogleAuthEnabled(env) {
  return Boolean(trim(env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID));
}

function isRazorpayEnabled(env) {
  return Boolean(trim(env.EXPO_PUBLIC_RAZORPAY_KEY_ID));
}

function buildPlugins(env) {
  const plugins = [];

  if (isFirebaseEnabled(env)) {
    plugins.push('expo-notifications');
  }

  if (isGoogleAuthEnabled(env)) {
    plugins.push([
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: trim(env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME) || undefined,
      },
    ]);
  }

  return plugins;
}

function buildExtra(env) {
  const extra = {
    apiUrl: trim(env.EXPO_PUBLIC_API_URL) || undefined,
    features: {
      firebase: isFirebaseEnabled(env),
      googleAuth: isGoogleAuthEnabled(env),
      razorpay: isRazorpayEnabled(env),
    },
  };

  if (isFirebaseEnabled(env)) {
    extra.firebase = {
      apiKey: trim(env.EXPO_PUBLIC_FIREBASE_API_KEY),
      authDomain: trim(env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
      projectId: trim(env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
      storageBucket: trim(env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
      messagingSenderId: trim(env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
      appId: trim(env.EXPO_PUBLIC_FIREBASE_APP_ID),
      measurementId: trim(env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID),
    };
  }

  if (isGoogleAuthEnabled(env)) {
    extra.google = {
      webClientId: trim(env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
      iosClientId: trim(env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
      androidClientId: trim(env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
    };
  }

  if (isRazorpayEnabled(env)) {
    extra.razorpay = {
      keyId: trim(env.EXPO_PUBLIC_RAZORPAY_KEY_ID),
      currency: trim(env.EXPO_PUBLIC_RAZORPAY_CURRENCY) || 'INR',
    };
  }

  if (trim(env.EAS_PROJECT_ID)) {
    extra.eas = { projectId: trim(env.EAS_PROJECT_ID) };
  }

  return extra;
}

module.exports = {
  trim,
  resolveFromRoot,
  isFirebaseEnabled,
  isGoogleAuthEnabled,
  isRazorpayEnabled,
  buildPlugins,
  buildExtra,
};
