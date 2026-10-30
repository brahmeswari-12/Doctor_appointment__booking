import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import doctorService from '../../services/doctorService.js';
import api from '../../services/api.js';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import DoctorCard from '../../components/DoctorCard.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

const SPEC_ICONS = {
  Cardiologist: '❤️',
  Dermatologist: '✨',
  Neurologist: '🧠',
  Orthopedic: '🦴',
  Pediatrician: '👶',
  Dentist: '🦷',
  Gynecologist: '🌸',
  'General Physician': '🩺',
  'ENT Specialist': '👂',
  Ophthalmologist: '👁️',
};

// Landing page: hero, features, how-it-works, featured doctors, and specializations.
export default function Home() {
  const navigate = useNavigate();
  const { token, role } = useAuth();

  const fetchDoctors = useCallback(() => doctorService.getDoctors(), []);
  const fetchSpecializations = useCallback(() => doctorService.getSpecializations(), []);
  const fetchPublicStats = useCallback(() => api.get('/public/stats'), []);

  const { data: doctors, loading: loadingDoctors, error: doctorsError } = useFetch(fetchDoctors);
  const { data: specializations, loading: loadingSpecs } = useFetch(fetchSpecializations);
  const { data: publicStats } = useFetch(fetchPublicStats);

  // Send the visitor to the right place when they click "Book".
  const handleBook = (doctor) => {
    if (!token) {
      navigate('/login', { state: { from: `/doctors/${doctor.id}` } });
      return;
    }
    if (role === 'patient') {
      navigate(`/patient/book?doctorId=${doctor.id}`);
      return;
    }
    navigate(`/doctors/${doctor.id}`);
  };

  const featured = Array.isArray(doctors) ? doctors.slice(0, 6) : [];
  const specs = Array.isArray(specializations) ? specializations : [];

  const totalDoctors = publicStats?.doctors ?? (doctors?.length || 0);
  const totalSpecs = publicStats?.specializations ?? (specs?.length || 0);
  const totalBookings = publicStats?.appointments ?? 0;

  return (
    <div>
      {/* --------------------------------- Hero -------------------------------- */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="hero-pill-badge">
              <span className="hero-pill-sparkle">✨</span>
              <span>Next-Gen Healthcare · 100% Verified Specialists</span>
            </div>
            <h1>
              Book your doctor&apos;s appointment <span className="hero-highlight">in minutes</span>
            </h1>
            <p className="hero-desc">
              Find trusted specialists, view real-time open slots, and confirm appointments
              effortlessly. High-quality healthcare without waiting room queues.
            </p>
            <div className="hero-actions">
              <Link to="/doctors" className="btn btn-lg hero-cta-primary">
                <span>🔍</span> Find a Doctor
              </Link>
              {!token && (
                <Link to="/register" className="btn btn-lg hero-cta-secondary">
                  <span>⚡</span> Get Started Free
                </Link>
              )}
            </div>

            <div className="hero-stats">
              <div className="hero-stat-card">
                <div className="hero-stat-value">{totalDoctors}+</div>
                <div className="hero-stat-label">Verified Doctors</div>
              </div>
              <div className="hero-stat-card">
                <div className="hero-stat-value">{totalSpecs}+</div>
                <div className="hero-stat-label">Specializations</div>
              </div>
              <div className="hero-stat-card">
                <div className="hero-stat-value">{totalBookings}+</div>
                <div className="hero-stat-label">Appointments Booked</div>
              </div>
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-card-header">
              <div className="hero-card-badge">Why Patients Choose Us</div>
              <h3>Smart, Secure &amp; Seamless Care</h3>
            </div>
            <div className="hero-feature-list">
              <div className="hero-feature-item">
                <div className="feature-icon-box">🩺</div>
                <div>
                  <strong>Certified Specialists</strong>
                  <p>All doctors are vetted and approved before appearing on the platform.</p>
                </div>
              </div>
              <div className="hero-feature-item">
                <div className="feature-icon-box">🕒</div>
                <div>
                  <strong>Real-Time Slot Scheduling</strong>
                  <p>30-minute interval bookings with zero waiting or double bookings.</p>
                </div>
              </div>
              <div className="hero-feature-item">
                <div className="feature-icon-box">💳</div>
                <div>
                  <strong>Flexible Payment Options</strong>
                  <p>Pay online securely with UPI/Card or in cash at the clinic desk.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------- How It Works --------------------------- */}
      <section className="section-padding how-it-works-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="badge badge-info mb-2">Simple 3-Step Process</span>
            <h2>How MediCare Works</h2>
            <p className="text-muted max-w-md mx-auto">
              Scheduling your healthcare visit is smooth, transparent, and takes less than a minute.
            </p>
          </div>

          <div className="grid grid-3 mt-5">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">🔎</div>
              <h3>Find Your Specialist</h3>
              <p className="text-muted">
                Search by symptoms or filter by medical specialty, experience, and consultation fees.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">📅</div>
              <h3>Choose Date &amp; Slot</h3>
              <p className="text-muted">
                View open live slots in the doctor&apos;s real-time schedule and select what fits you.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">✅</div>
              <h3>Instant Confirmation</h3>
              <p className="text-muted">
                Receive instant booking details and track visit status right from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------- Specializations --------------------------- */}
      <section className="section-padding bg-surface-alt">
        <div className="container">
          <div className="flex-between flex-wrap gap-3 mb-4">
            <div>
              <span className="badge badge-primary mb-2">Specialties</span>
              <h2>Browse by Medical Specialization</h2>
              <p className="text-muted mb-0">Select the specialized field that addresses your health needs.</p>
            </div>
            <Link to="/doctors" className="btn btn-outline btn-sm">
              View All Doctors &rarr;
            </Link>
          </div>

          {loadingSpecs && <Loader text="Loading specializations..." />}

          {!loadingSpecs && specs.length === 0 && (
            <p className="text-muted">No specializations available yet.</p>
          )}

          {!loadingSpecs && specs.length > 0 && (
            <div className="grid grid-4">
              {specs.map((spec) => (
                <Link
                  key={spec.id}
                  to={`/doctors?specializationId=${spec.id}`}
                  className="spec-card"
                >
                  <div className="spec-card-icon" aria-hidden="true">
                    {SPEC_ICONS[spec.name] || '🩺'}
                  </div>
                  <h3 className="spec-name">{spec.name}</h3>
                  <p className="spec-desc text-muted">
                    {spec.description || 'Consult with verified experts.'}
                  </p>
                  <div className="spec-footer">
                    <span className="spec-count-chip">
                      {spec.doctorCount ? `${spec.doctorCount} specialist${spec.doctorCount === 1 ? '' : 's'}` : 'Open for bookings'}
                    </span>
                    <span className="spec-arrow">&rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------- Featured Doctors ------------------------------- */}
      <section className="section-padding" style={{ backgroundColor: '#fff' }}>
        <div className="container">
          <div className="flex-between flex-wrap gap-3 mb-4">
            <div>
              <span className="badge badge-success mb-2">Top Rated</span>
              <h2>Featured Medical Specialists</h2>
              <p className="text-muted mb-0">Experienced practitioners available for consultation.</p>
            </div>
            <Link to="/doctors" className="btn btn-outline btn-sm">
              See All Specialists &rarr;
            </Link>
          </div>

          {doctorsError && <Alert type="error" message={doctorsError.message} />}
          {loadingDoctors && <Loader text="Loading doctors..." />}

          {!loadingDoctors && !doctorsError && featured.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon" aria-hidden="true">&#129658;</div>
              <div className="empty-state-title">No doctors currently listed</div>
              <p>Doctors will appear here once approved by the administrator.</p>
            </div>
          )}

          {!loadingDoctors && featured.length > 0 && (
            <div className="grid grid-3">
              {featured.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onView={(d) => navigate(`/doctors/${d.id}`)}
                  onBook={handleBook}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------- CTA Banner ------------------------------- */}
      <section className="cta-banner-section">
        <div className="container">
          <div className="cta-banner-card">
            <div className="cta-content">
              <h2>Need to consult a doctor today?</h2>
              <p>
                Join thousands of patients who book and manage their medical consultations
                with ease on MediCare.
              </p>
            </div>
            <div className="cta-actions">
              <Link to="/doctors" className="btn btn-lg btn-primary">
                Find a Doctor Now
              </Link>
              {!token && (
                <Link to="/register" className="btn btn-lg btn-outline" style={{ color: '#fff', borderColor: '#fff' }}>
                  Register Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
