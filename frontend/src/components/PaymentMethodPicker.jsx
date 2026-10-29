import { formatCurrency } from '../utils/helpers.js';

// Human-friendly copy for each supported payment method.
const METHOD_META = {
  cash: { label: 'Cash at Clinic', hint: 'Book now and pay at the reception desk.' },
  card: { label: 'Credit / Debit Card', hint: 'Visa, Mastercard, RuPay and more.' },
  upi: { label: 'UPI', hint: 'GPay, PhonePe, Paytm or any UPI app.' },
  netbanking: { label: 'Net Banking', hint: 'All major Indian banks.' },
  wallet: { label: 'Wallet', hint: 'Pay using a supported wallet.' },
};

const DEFAULT_METHODS = ['cash', 'card', 'upi', 'netbanking', 'wallet'];

// Display label for a payment method (e.g. "upi" -> "UPI").
export function paymentMethodLabel(method) {
  return METHOD_META[method]?.label || String(method || '').toUpperCase();
}

/**
 * Radio list of payment methods. Purely presentational - the parent owns the
 * selection and performs the actual charge.
 *
 * @param {string} value - currently selected method
 * @param {Function} onChange - (method) => void
 * @param {Array<string>} methods - methods offered by the backend
 * @param {number} amount - amount payable (shown next to the online options)
 * @param {string} currency
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
    <div className="pay-methods" role="radiogroup" aria-label="Payment method">
      {options.map((method) => {
        const meta = METHOD_META[method] || { label: method, hint: '' };
        const isSelected = value === method;
        return (
          <label
            key={method}
            className={`pay-method${isSelected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
          >
            <input
              type="radio"
              name="payment-method"
              value={method}
              checked={isSelected}
              disabled={disabled}
              onChange={() => onChange?.(method)}
            />
            <span className="pay-method-body">
              <span className="pay-method-label">{meta.label}</span>
              {meta.hint && <span className="pay-method-hint">{meta.hint}</span>}
            </span>
            {method !== 'cash' && (
              <span className="pay-method-amount">{formatCurrency(amount, currency)}</span>
            )}
          </label>
        );
      })}
    </div>
  );
}
