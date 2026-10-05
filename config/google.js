/**
 * Google OAuth — server-side verification.
 */
export const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  iosClientId: process.env.GOOGLE_IOS_CLIENT_ID || '',
  androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || '',
};

export const isGoogleConfigured = () => Boolean(googleConfig.clientId);

export default googleConfig;
