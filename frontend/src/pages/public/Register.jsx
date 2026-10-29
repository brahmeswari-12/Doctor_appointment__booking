import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { useToastContext } from '../../context/ToastContext.jsx';
import doctorService from '../../services/doctorService.js';
import Alert from '../../components/Alert.jsx';
import Loader from '../../components/Loader.jsx';

const ROLE_HOME = {
  patient: '/patient',
  doctor: '/doctor',
};

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  specializationId: '',
  qualification: '',
  experience: '',
  consultationFee: '',
  bio: '',
};

// Registration page with a Patient / Doctor role toggle.
export default function Register() {
  const [role, setRole] = useState('patient');
  const [form, setForm] = useState(INITIAL_FORM);
  const [specializations, setSpecializations] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const toast = useToastContext();
  const navigate = useNavigate();

  // Load specializations once for the doctor form.
  useEffect(() => {
    let active = true;
    doctorService
      .getSpecializations()
      .then((data) => {
        if (active) setSpecializations(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setSpecializations([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const switchRole = (nextRole) => {
    setRole(nextRole);
    setErrors({});
    setServerError('');
  };

  const validate = () => {
    const next = {};

    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.phone.trim()) next.phone = 'Phone number is required.';
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters.';
    if (!form.confirmPassword) next.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.';

    if (role === 'doctor') {
      if (!form.specializationId) next.specializationId = 'Please select a specialization.';
      if (!form.qualification.trim()) next.qualification = 'Qualification is required.';
      if (form.experience === '' || Number(form.experience) < 0) next.experience = 'Enter valid years of experience.';
      if (form.consultationFee === '' || Number(form.consultationFee) < 0) next.consultationFee = 'Enter a valid fee.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      role,
    };

    if (role === 'doctor') {
      payload.specializationId = Number(form.specializationId);
      payload.qualification = form.qualification.trim();
      payload.experience = Number(form.experience);
      payload.consultationFee = Number(form.consultationFee);
      payload.bio = form.bio.trim();
    }

    setSubmitting(true);
    try {
      const data = await register(payload);
      toast.success('Registration successful!');

      // Doctors usually need admin approval; send them to their dashboard.
      if (data?.token && data?.user) {
        navigate(ROLE_HOME[data.user.role] || '/', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className={`auth-card${role === 'doctor' ? ' auth-card-wide' : ''}`}>
        <div className="auth-header">
          <h1>Create your account</h1>
          <p>Join MediCare and book appointments in seconds.</p>
        </div>

        <div className="flex-center mb-4">
          <div className="segmented" role="tablist" aria-label="Account type">
            <button
              type="button"
              role="tab"
              aria-selected={role === 'patient'}
              className={role === 'patient' ? 'active' : ''}
              onClick={() => switchRole('patient')}
            >
              Patient
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === 'doctor'}
              className={role === 'doctor' ? 'active' : ''}
              onClick={() => switchRole('doctor')}
            >
              Doctor
            </button>
          </div>
        </div>

        {serverError && <Alert type="error" message={serverError} onClose={() => setServerError('')} />}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="reg-name"
                name="name"
                className="form-control"
                value={form.name}
                onChange={handleChange}
                placeholder={role === 'doctor' ? 'Dr. Jane Doe' : 'Jane Doe'}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">
                Phone <span className="required">*</span>
              </label>
              <input
                id="reg-phone"
                name="phone"
                className="form-control"
                value={form.phone}
                onChange={handleChange}
                placeholder="9876543210"
              />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              Email <span className="required">*</span>
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              className="form-control"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Password <span className="required">*</span>
              </label>
              <input
                id="reg-password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="form-control"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="form-control"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
              />
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          {role === 'doctor' && (
            <>
              <div className="divider" />
              <h3>Professional Details</h3>

              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-spec">
                    Specialization <span className="required">*</span>
                  </label>
                  <select
                    id="reg-spec"
                    name="specializationId"
                    className="form-select"
                    value={form.specializationId}
                    onChange={handleChange}
                  >
                    <option value="">Select specialization</option>
                    {specializations.map((spec) => (
                      <option key={spec.id} value={spec.id}>{spec.name}</option>
                    ))}
                  </select>
                  {errors.specializationId && <span className="form-error">{errors.specializationId}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-qualification">
                    Qualification <span className="required">*</span>
                  </label>
                  <input
                    id="reg-qualification"
                    name="qualification"
                    className="form-control"
                    value={form.qualification}
                    onChange={handleChange}
                    placeholder="MBBS, MD"
                  />
                  {errors.qualification && <span className="form-error">{errors.qualification}</span>}
                </div>
              </div>

              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-experience">
                    Experience (years) <span className="required">*</span>
                  </label>
                  <input
                    id="reg-experience"
                    name="experience"
                    type="number"
                    min="0"
                    className="form-control"
                    value={form.experience}
                    onChange={handleChange}
                    placeholder="5"
                  />
                  {errors.experience && <span className="form-error">{errors.experience}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-fee">
                    Consultation Fee (₹) <span className="required">*</span>
                  </label>
                  <input
                    id="reg-fee"
                    name="consultationFee"
                    type="number"
                    min="0"
                    className="form-control"
                    value={form.consultationFee}
                    onChange={handleChange}
                    placeholder="500"
                  />
                  {errors.consultationFee && <span className="form-error">{errors.consultationFee}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-bio">Short Bio</label>
                <textarea
                  id="reg-bio"
                  name="bio"
                  className="form-control"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell patients about your expertise..."
                />
              </div>

              <Alert
                type="info"
                message="Doctor accounts are reviewed by an administrator before appearing in search results."
              />
            </>
          )}

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? <Loader size="sm" inline /> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
