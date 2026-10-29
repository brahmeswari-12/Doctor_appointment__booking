import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import doctorService from '../../services/doctorService.js';
import useAuth from '../../hooks/useAuth.js';
import { useToastContext } from '../../context/ToastContext.jsx';
import DoctorCard from '../../components/DoctorCard.jsx';
import SearchFilterBar from '../../components/SearchFilterBar.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

// Public doctor directory with search + specialization filter.
export default function DoctorList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [specializationId, setSpecializationId] = useState(searchParams.get('specializationId') || '');

  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const toast = useToastContext();
  const { token, role } = useAuth();

  // Load specializations once.
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

  // Debounced fetch whenever the filters change.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    const timer = setTimeout(() => {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (specializationId) params.specializationId = specializationId;

      doctorService
        .getDoctors(params)
        .then((data) => {
          if (active) setDoctors(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          if (active) setError(err.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, specializationId]);

  // Keep the URL in sync so results are shareable.
  useEffect(() => {
    const next = {};
    if (search.trim()) next.search = search.trim();
    if (specializationId) next.specializationId = specializationId;
    setSearchParams(next, { replace: true });
  }, [search, specializationId, setSearchParams]);

  const handleBook = (doctor) => {
    if (!token) {
      toast.info('Please sign in to book an appointment.');
      navigate('/login', { state: { from: `/doctors/${doctor.id}` } });
      return;
    }
    if (role === 'patient') {
      navigate(`/patient/book?doctorId=${doctor.id}`);
      return;
    }
    toast.warning('Only patient accounts can book appointments.');
  };

  const handleReset = () => {
    setSearch('');
    setSpecializationId('');
  };

  const specializationsWithAll = useMemo(
    () => (Array.isArray(specializations) ? specializations : []),
    [specializations]
  );

  return (
    <div className="container section-padding">
      <div className="page-header">
        <h1 className="page-title">Find a Doctor</h1>
        <p className="page-subtitle">
          Search by name or filter by specialization to find the right specialist for you.
        </p>
      </div>

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search doctors by name..."
        specializations={specializationsWithAll}
        specializationId={specializationId}
        onSpecializationChange={setSpecializationId}
        showSpecialization
        onReset={handleReset}
      />

      {error && <Alert type="error" message={error} />}

      {loading && <Loader text="Finding doctors..." />}

      {!loading && !error && doctors.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">&#128269;</div>
          <div className="empty-state-title">No doctors found</div>
          <p>Try adjusting your search or clearing the filters.</p>
          <button type="button" className="btn btn-outline mt-3" onClick={handleReset}>
            Clear filters
          </button>
        </div>
      )}

      {!loading && doctors.length > 0 && (
        <>
          <p className="text-muted mb-4">{doctors.length} doctor(s) found</p>
          <div className="grid grid-3">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onView={(d) => navigate(`/doctors/${d.id}`)}
                onBook={handleBook}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
