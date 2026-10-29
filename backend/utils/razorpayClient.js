/**
 * Minimal Razorpay REST client.
 *
 * Uses the Orders API over HTTPS with Basic auth, which keeps the project
 * dependency-free (no `razorpay` npm package required).
 */
const crypto = require('crypto');
const { KEY_ID, KEY_SECRET } = require('../config/payment');

const API_BASE = 'https://api.razorpay.com/v1';

function authHeader() {
  return `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`;
}

/**
 * Creates a Razorpay order.
 * `amount` must be in the smallest currency unit (paise for INR).
 */
async function createOrder({ amount, currency, receipt, notes }) {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify({ amount, currency, receipt, notes }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (body && body.error && body.error.description) || 'Razorpay order creation failed.';
    throw new Error(message);
  }

  return body;
}

/** Verifies the checkout signature: HMAC_SHA256(order_id|payment_id, key_secret). */
function verifySignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));

  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { createOrder, verifySignature };
