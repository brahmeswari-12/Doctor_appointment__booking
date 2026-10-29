import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import doctorService from '../../services/doctorService.js';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import DoctorCard from '../../components/DoctorCard.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

// Landing page: hero, featured doctors and specializations.
export default function Home() {
  const navigate = useNavigate();
  const { token, role } = useAuth();

  const fetchDoctors = useCallback(() => doctorService.getDoctors(), []);
  const fetchSpecializations = useCallback(() => doctorService.getSpecializations(), []);

  const { data: doctors, loading: loadingDoctors, error: doctorsError } = useFetch(fetchDoctors);
  const { data: specializations, loading: loadingSpecs } = useFetch(fetchSpecializations);

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

  return (
    <div>
      {/* --------------------------------- Hero -------------------------------- */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>Book your doctor&apos;s appointment in minutes</h1>
            <p>
              Find the right specialist, view their availability and schedule a visit
              online. Quality healthcare, without the waiting room queues.
            </p>
            <div className="hero-actions">
              <Link to="/doctors" className="btn btn-lg hero-cta-primary">
                Find a Doctor
              </Link>
              <Link to="/register" className="btn btn-lg hero-cta-secondary">
                Create Account
              </Link>
            </div>

            <div className="hero-stats">
              <div>
                <div className="hero-stat-value">{doctors?.length ?? 0}+</div>
                <div className="hero-stat-label">Doctors</div>
              </div>
              <div>
                <div className="hero-stat-value">{specializations?.length ?? 0}+</div>
                <div className="hero-stat-label">Specializations</div>
              </div>
              <div>
                <div className="hero-stat-value">24/7</div>
                <div className="hero-stat-label">Online Booking</div>
              </div>
            </div>
          </div>

          <div className="hero-card">
            <h3>Why MediCare?</h3>
            <ul style={{ color: 'rgba(255,255,255,0.92)', paddingLeft: 18, lineHeight: 1.9 }}>
              <li>Verified and experienced doctors</li>
              <li>Real-time slot availability</li>
              <li>Instant booking confirmation</li>
              <li>Manage all your visits in one place</li>
            </ul>
          </div>
        </div>
      </section>

      {/* --------------------------- Specializations --------------------------- */}
      <section className="section-padding">
        <div className="container">
          <div className="flex-between flex-wrap gap-3 mb-4">
            <div>
              <h2>Browse by Specialization</h2>
              <p className="text-muted mb-0">Choose the care that fits your needs.</p>
            </div>
            <Link to="/doctors" className="btn btn-outline btn-sm">View all doctors</Link>
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
                  className="info-card"
                >
                  <div className="info-card-icon" aria-hidden="true">&#129658;</div>
                  <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>{spec.name}</h3>
                  <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                    {spec.description || 'Consult a specialist today.'}
                  </p>
                  <span className="chip mt-3">
                    {spec.doctorCount ? `${spec.doctorCount} doctor${spec.doctorCount === 1 ? '' : 's'}` : 'No doctors yet'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------- Featured ------------------------------- */}
      <section className="section-padding" style={{ backgroundColor: '#fff' }}>
        <div className="container">
          <div className="flex-between flex-wrap gap-3 mb-4">
            <div>
              <h2>Featured Doctors</h2>
              <p className="text-muted mb-0">Highly rated professionals ready to help.</p>
            </div>
          </div>

          {doctorsError && <Alert type="error" message={doctorsError.message} />}
          {loadingDoctors && <Loader text="Loading doctors..." />}

          {!loadingDoctors && !doctorsError && featured.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon" aria-hidden="true">&#129658;</div>
              <div className="empty-state-title">No doctors yet</div>
              <p>Doctors will appear here once they are registered and approved.</p>
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
    </div>
  );
}
