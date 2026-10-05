/**
 * Google Sign-In — optional. Enabled only when EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is set.
 * See features.js and app.config.cjs (plugin auto-registers when key present).
 */
export const googleAuthConfig = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
  iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME || '',
};

export const isGoogleAuthConfigured = () => Boolean(googleAuthConfig.webClientId);

export default googleAuthConfig;
