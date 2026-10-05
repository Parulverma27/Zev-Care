/**
 * Razorpay — optional. Enabled only when EXPO_PUBLIC_RAZORPAY_KEY_ID is set.
 * Never put KEY_SECRET in the app (server only: config/razorpay.js).
 */
export const razorpayConfig = {
  keyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
  currency: process.env.EXPO_PUBLIC_RAZORPAY_CURRENCY || 'INR',
};

export const isRazorpayConfigured = () => Boolean(razorpayConfig.keyId);

export default razorpayConfig;
