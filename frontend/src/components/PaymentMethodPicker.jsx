import { formatCurrency } from '../utils/helpers.js';

// Human-friendly copy & icons for each supported payment method.
const METHOD_META = {
  cash: {
    icon: '💵',
    label: 'Pay at Clinic (Cash / Card)',
    hint: 'Book your slot now and pay in person at the clinic reception.',
    tag: 'No Prepayment',
  },
  upi: {
    icon: '📱',
    label: 'Instant UPI',
    hint: 'Google Pay, PhonePe, Paytm, BHIM, or any UPI app.',
    tag: 'Fastest',
  },
  card: {
    icon: '💳',
    label: 'Credit / Debit Card',
    hint: 'Visa, Mastercard, RuPay, Maestro & American Express.',
    tag: 'Secure 3D',
  },
  netbanking: {
    icon: '🏦',
    label: 'Net Banking',
    hint: 'All major Indian banks: SBI, HDFC, ICICI, Axis and 50+ more.',
    tag: 'Direct Bank',
  },
  wallet: {
    icon: '👛',
    label: 'Mobile Wallets',
    hint: 'Pay via Paytm Wallet, PhonePe, Amazon Pay, MobiKwik.',
    tag: 'Wallet',
  },
};

const DEFAULT_METHODS = ['cash', 'upi', 'card', 'netbanking', 'wallet'];

// Display label for a payment method (e.g. "upi" -> "UPI").
export function paymentMethodLabel(method) {
  return METHOD_META[method]?.label || String(method || '').toUpperCase();
}

/**
 * Modern radio list of payment methods with visual card styling.
 */
export default function PaymentMethodPicker({
  value,
  onChange,
  methods = DEFAULT_METHODS,
  amount = 0,
  currency = 'INR',
  disabled = false,
}) {
  const options = Array.isArray(methods) && methods.length ? methods : DEFAULT_METHODS;

  return (
    <div className="pay-methods-grid" role="radiogroup" aria-label="Payment method">
      {options.map((method) => {
        const meta = METHOD_META[method] || {
          icon: '💳',
          label: method,
          hint: '',
          tag: 'Standard',
        };
        const isSelected = value === method;
        return (
          <label
            key={method}
            className={`pay-method-card${isSelected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
          >
            <input
              type="radio"
              name="payment-method"
              value={method}
              checked={isSelected}
              disabled={disabled}
              onChange={() => onChange?.(method)}
              className="pay-radio-input"
            />
            <div className="pay-card-left">
              <span className="pay-method-icon" aria-hidden="true">{meta.icon}</span>
              <div className="pay-method-text">
                <div className="pay-method-header">
                  <span className="pay-method-label">{meta.label}</span>
                  {meta.tag && <span className="pay-method-tag">{meta.tag}</span>}
                </div>
                {meta.hint && <p className="pay-method-hint mb-0">{meta.hint}</p>}
              </div>
            </div>

            <div className="pay-card-right">
              {method !== 'cash' ? (
                <span className="pay-method-amount">{formatCurrency(amount, currency)}</span>
              ) : (
                <span className="pay-method-free">₹0 now</span>
              )}
              <div className={`custom-radio-indicator${isSelected ? ' checked' : ''}`}>
                {isSelected && <span className="radio-inner-dot" />}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
