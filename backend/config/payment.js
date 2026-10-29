/**
 * Payment gateway configuration.
 *
 * Razorpay is used when both RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set.
 * Without them the app falls back to a built-in simulator, so the whole
 * booking -> payment flow works locally with no external account.
 */

const KEY_ID = (process.env.RAZORPAY_KEY_ID || '').trim();
const KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || '').trim();
const CURRENCY = (process.env.PAYMENT_CURRENCY || 'INR').trim().toUpperCase();

const isLive = Boolean(KEY_ID && KEY_SECRET);

module.exports = {
  KEY_ID,
  KEY_SECRET,
  CURRENCY,
  /** true when real Razorpay credentials are configured. */
  isLive,
  /** 'razorpay' when live, otherwise 'simulator'. */
  provider: isLive ? 'razorpay' : 'simulator',
};
