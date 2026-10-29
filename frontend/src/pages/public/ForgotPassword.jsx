import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService.js';
import { useToastContext } from '../../context/ToastContext.jsx';
import Alert from '../../components/Alert.jsx';
import Loader from '../../components/Loader.jsx';

// Two-step password reset: request a token, then set a new password.
export default function ForgotPassword() {
  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToastContext();
  const navigate = useNavigate();

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await authService.forgotPassword(email.trim());
      toast.success(data?.message || 'If the email exists, a reset link has been sent.');
      setInfo(
        'Check your inbox for the reset instructions. If your backend returns a reset token in development, enter it below.'
      );
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Please enter the reset token from your email.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await authService.resetPassword(token.trim(), password);
      toast.success(data?.message || 'Password reset successfully. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset your password</h1>
          <p>
            {step === 'request'
              ? 'Enter your email and we will send reset instructions.'
              : 'Enter the reset token and choose a new password.'}
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {info && <Alert type="info" message={info} onClose={() => setInfo('')} />}

        {step === 'request' ? (
          <form onSubmit={handleRequest} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="fp-email">
                Email <span className="required">*</span>
              </label>
              <input
                id="fp-email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? <Loader size="sm" inline /> : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="fp-token">
                Reset Token <span className="required">*</span>
              </label>
              <input
                id="fp-token"
                className="form-control"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste the token from your email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fp-password">
                New Password <span className="required">*</span>
              </label>
              <input
                id="fp-password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fp-confirm">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                id="fp-confirm"
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your new password"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? <Loader size="sm" inline /> : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          Remembered it? <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
