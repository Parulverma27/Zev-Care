/**
 * Optional integrations — enabled only when env keys are present.
 * Use isFeatureEnabled('razorpay') before calling payment/Firebase/Google code.
 */

const trim = (v) => (v || '').trim();

export const features = {
  firebase: () =>
    Boolean(
      trim(process.env.FIREBASE_PROJECT_ID) &&
        trim(process.env.FIREBASE_CLIENT_EMAIL) &&
        trim(process.env.FIREBASE_PRIVATE_KEY)
    ),
  googleAuth: () =>
    Boolean(trim(process.env.GOOGLE_CLIENT_ID) || trim(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID)),
  razorpay: () =>
    Boolean(trim(process.env.RAZORPAY_KEY_ID) && trim(process.env.RAZORPAY_KEY_SECRET)),
  twilio: () =>
    Boolean(
      trim(process.env.TWILIO_ACCOUNT_SID) &&
        trim(process.env.TWILIO_AUTH_TOKEN) &&
        trim(process.env.TWILIO_PHONE_NUMBER)
    ),
};

export function isFeatureEnabled(name) {
  const check = features[name];
  return typeof check === 'function' ? check() : false;
}

export function listEnabledFeatures() {
  return Object.keys(features).filter((key) => isFeatureEnabled(key));
}

export default features;
