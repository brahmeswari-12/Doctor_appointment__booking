import { useCallback, useEffect, useState } from 'react';
import authService from '../../services/authService.js';
import doctorService from '../../services/doctorService.js';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import { useToastContext } from '../../context/ToastContext.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

const EMPTY_FORM = {
  name: '',
  phone: '',
  specializationId: '',
  qualification: '',
  experience: '',
  consultationFee: '',
  bio: '',
};

// Doctor profile: view and edit professional details.
export default function DoctorProfile() {
  const { user, updateUser } = useAuth();
  const toast = useToastContext();

  // /auth/me returns { user, profile } and gives us the doctor's own profile.
  const fetchMe = useCallback(() => authService.getMe(), []);
  const { data: me, loading, error } = useFetch(fetchMe);

  const [specializations, setSpecializations] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

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

  useEffect(() => {
    const profile = me?.profile || {};
    if (!me) return;
    setForm({
      name: profile.name || me.user?.name || user?.name || '',
      phone: profile.phone || me.user?.phone || '',
      specializationId: profile.specializationId ?? profile.specialization?.id ?? '',
      qualification: profile.qualification || '',
      experience: profile.experience ?? '',
      consultationFee: profile.consultationFee ?? '',
      bio: profile.bio || '',
    });
  }, [me, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    const profile = me?.profile || {};
    setForm({
      name: profile.name || me?.user?.name || user?.name || '',
      phone: profile.phone || me?.user?.phone || '',
      specializationId: profile.specializationId ?? profile.specialization?.id ?? '',
      qualification: profile.qualification || '',
      experience: profile.experience ?? '',
      consultationFee: profile.consultationFee ?? '',
      bio: profile.bio || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');

    if (!form.name.trim()) {
      setSaveError('Name is required.');
      return;
    }
    if (!form.specializationId) {
      setSaveError('Please select a specialization.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        specializationId: Number(form.specializationId),
        qualification: form.qualification.trim(),
        experience: Number(form.experience) || 0,
        consultationFee: Number(form.consultationFee) || 0,
        bio: form.bio.trim(),
      };
      const updated = await doctorService.updateProfile(payload);
      toast.success('Profile updated successfully.');
      updateUser({ name: updated?.name || payload.name, phone: updated?.phone || payload.phone });
      setEditing(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader text="Loading your profile..." />;
  if (error) return <Alert type="error" message={error.message} />;

  const profile = me?.profile || {};

  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <h1>My Profile</h1>
          <p>Manage your professional information.</p>
        </div>
        {!editing && (
          <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {saveError && <Alert type="error" message={saveError} onClose={() => setSaveError('')} />}

      {profile.status && (
        <Alert
          type={profile.status === 'approved' ? 'success' : profile.status === 'rejected' ? 'error' : 'info'}
          message={`Your account status is "${profile.status}". ${
            profile.status === 'approved'
              ? 'You are visible to patients.'
              : 'You will be visible once approved by an administrator.'
          }`}
        />
      )}

      <div className="card" style={{ maxWidth: 760 }}>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="dp-name">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="dp-name"
                name="name"
                className="form-control"
                value={form.name}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dp-phone">Phone</label>
              <input
                id="dp-phone"
                name="phone"
                className="form-control"
                value={form.phone}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dp-email">Email</label>
            <input
              id="dp-email"
              className="form-control"
              value={me?.user?.email || profile.email || ''}
              disabled
              readOnly
            />
            <span className="form-hint">Email cannot be changed.</span>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="dp-spec">
                Specialization <span className="required">*</span>
              </label>
              <select
                id="dp-spec"
                name="specializationId"
                className="form-select"
                value={form.specializationId}
                onChange={handleChange}
                disabled={!editing}
              >
                <option value="">Select specialization</option>
                {specializations.map((spec) => (
                  <option key={spec.id} value={spec.id}>{spec.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dp-qualification">Qualification</label>
              <input
                id="dp-qualification"
                name="qualification"
                className="form-control"
                value={form.qualification}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="dp-experience">Experience (years)</label>
              <input
                id="dp-experience"
                name="experience"
                type="number"
                min="0"
                className="form-control"
                value={form.experience}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dp-fee">Consultation Fee (₹)</label>
              <input
                id="dp-fee"
                name="consultationFee"
                type="number"
                min="0"
                className="form-control"
                value={form.consultationFee}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dp-bio">Short Bio</label>
            <textarea
              id="dp-bio"
              name="bio"
              className="form-control"
              value={form.bio}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>

          {editing && (
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <Loader size="sm" inline /> : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={saving}
                onClick={() => {
                  resetForm();
                  setEditing(false);
                  setSaveError('');
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
