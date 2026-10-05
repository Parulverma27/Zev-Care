/**
 * Razorpay — server-side payments (never expose KEY_SECRET to the app).
 */
export const razorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID || '',
  keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
};

export const isRazorpayConfigured = () =>
  Boolean(razorpayConfig.keyId && razorpayConfig.keySecret);

export default razorpayConfig;
