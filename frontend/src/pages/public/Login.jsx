import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { useToastContext } from '../../context/ToastContext.jsx';
import Alert from '../../components/Alert.jsx';

// Redirect target for each role after a successful login.
const ROLE_HOME = {
  patient: '/patient',
  doctor: '/doctor',
  admin: '/admin',
};

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@doccare.com', password: 'Admin@123', icon: '👑', badge: 'Full Access' },
  { role: 'Doctor', email: 'sarah.johnson@doccare.com', password: 'Doctor@123', icon: '🩺', badge: 'Cardiologist' },
  { role: 'Patient', email: 'john.miller@example.com', password: 'Patient@123', icon: '🧑', badge: 'Patient User' },
];

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const toast = useToastContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleDemoFill = (acc) => {
    setForm({ email: acc.email, password: acc.password });
    setError('');
    toast.info(`Filled with ${acc.role} credentials! Click 'Sign In' to continue.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      setError('Please enter both your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await login(form.email.trim(), form.password);
      const nextRole = data?.user?.role;
      const redirectTo = location.state?.from || ROLE_HOME[nextRole] || '/';
      toast.success('Welcome back!');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-pill">
            <span>🩺</span> MediCare Portal
          </div>
          <h1>Welcome back</h1>
          <p>Sign in to your account to continue.</p>
        </div>

        {/* ------------------- Quick Demo Login Fillers ------------------- */}
        <div className="demo-fill-card">
          <div className="demo-fill-title">
            <span>⚡</span> One-Click Demo Accounts (Instant Fill):
          </div>
          <div className="demo-fill-buttons">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                className="demo-pill-btn"
                onClick={() => handleDemoFill(acc)}
                title={`Autofill as ${acc.role}`}
              >
                <span className="demo-pill-icon">{acc.icon}</span>
                <span className="demo-pill-name">{acc.role}</span>
                <span className="demo-pill-badge">{acc.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address <span className="required">*</span>
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              className="form-control"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password <span className="required">*</span>
            </label>
            <div className="password-input-wrap">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="form-control"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                disabled={submitting}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                tabIndex="-1"
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
          </div>

          <div className="flex-between mb-4">
            <span />
            <Link to="/forgot-password" className="btn-link">Forgot password?</Link>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
