import { useCallback, useEffect, useState } from 'react';
import patientService from '../../services/patientService.js';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import { useToastContext } from '../../context/ToastContext.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

const EMPTY_FORM = {
  name: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  medicalHistory: '',
};

// Patient profile: view and edit the personal / medical details.
export default function PatientProfile() {
  const { updateUser } = useAuth();
  const toast = useToastContext();

  const fetchProfile = useCallback(() => patientService.getProfile(), []);
  const { data: profile, loading, error } = useFetch(fetchProfile);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Populate the form once the profile loads.
  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name || '',
      phone: profile.phone || '',
      dateOfBirth: profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : '',
      gender: profile.gender || '',
      address: profile.address || '',
      medicalHistory: profile.medicalHistory || '',
    });
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : '',
        gender: profile.gender || '',
        address: profile.address || '',
        medicalHistory: profile.medicalHistory || '',
      });
    }
    setEditing(false);
    setSaveError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');

    if (!form.name.trim()) {
      setSaveError('Name is required.');
      return;
    }
    if (!form.phone.trim()) {
      setSaveError('Phone number is required.');
      return;
    }

    setSaving(true);
    try {
      const updated = await patientService.updateProfile(form);
      toast.success('Profile updated successfully.');
      // Reflect the new name in the navbar/sidebar.
      updateUser({ name: updated?.name || form.name, phone: updated?.phone || form.phone });
      setEditing(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader text="Loading your profile..." />;
  if (error) return <Alert type="error" message={error.message} />;

  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal and medical information.</p>
        </div>
        {!editing && (
          <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {saveError && <Alert type="error" message={saveError} onClose={() => setSaveError('')} />}

      <div className="card" style={{ maxWidth: 760 }}>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="pp-name">
              Full Name <span className="required">*</span>
            </label>
            <input
              id="pp-name"
              name="name"
              className="form-control"
              value={form.name}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pp-email">Email</label>
            <input
              id="pp-email"
              className="form-control"
              value={profile?.email || ''}
              disabled
              readOnly
            />
            <span className="form-hint">Email cannot be changed.</span>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="pp-phone">
                Phone <span className="required">*</span>
              </label>
              <input
                id="pp-phone"
                name="phone"
                className="form-control"
                value={form.phone}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pp-dob">Date of Birth</label>
              <input
                id="pp-dob"
                name="dateOfBirth"
                type="date"
                className="form-control"
                value={form.dateOfBirth}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="pp-gender">Gender</label>
              <select
                id="pp-gender"
                name="gender"
                className="form-select"
                value={form.gender}
                onChange={handleChange}
                disabled={!editing}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pp-address">Address</label>
              <input
                id="pp-address"
                name="address"
                className="form-control"
                value={form.address}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pp-history">Medical History</label>
            <textarea
              id="pp-history"
              name="medicalHistory"
              className="form-control"
              value={form.medicalHistory}
              onChange={handleChange}
              disabled={!editing}
              placeholder="Allergies, chronic conditions, current medications..."
            />
          </div>

          {editing && (
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <Loader size="sm" inline /> : 'Save Changes'}
              </button>
              <button type="button" className="btn btn-outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
