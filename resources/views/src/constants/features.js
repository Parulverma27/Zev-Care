/**
 * Optional app features — auto-detected from env.
 * If keys are missing, feature is off. Add keys in .env to enable.
 */
import { isFirebaseConfigured } from './firebase';
import { isGoogleAuthConfigured } from './google';
import { isRazorpayConfigured } from './razorpay';

export const features = {
  firebase: isFirebaseConfigured(),
  googleAuth: isGoogleAuthConfigured(),
  razorpay: isRazorpayConfigured(),
};

export function isFeatureEnabled(name) {
  return Boolean(features[name]);
}

export function enabledFeatures() {
  return Object.entries(features)
    .filter(([, on]) => on)
    .map(([name]) => name);
}

export default features;
