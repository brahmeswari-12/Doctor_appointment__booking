import { useCallback, useEffect, useMemo, useState } from 'react';
import adminService from '../../services/adminService.js';
import doctorService from '../../services/doctorService.js';
import { useToastContext } from '../../context/ToastContext.jsx';
import { statusClass, labelize, initials } from '../../utils/helpers.js';
import SearchFilterBar from '../../components/SearchFilterBar.jsx';
import Modal from '../../components/Modal.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

const STATUS_OPTIONS = ['pending', 'approved', 'rejected'];

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  specializationId: '',
  qualification: '',
  experience: '',
  consultationFee: '',
  bio: '',
  status: 'approved',
};

// Admin: full doctor management (create, edit, approve, delete).
export default function ManageDoctors() {
  const toast = useToastContext();

  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [busyId, setBusyId] = useState(null);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await adminService.getDoctors(params);
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  useEffect(() => {
    doctorService
      .getSpecializations()
      .then((data) => setSpecializations(Array.isArray(data) ? data : []))
      .catch(() => setSpecializations([]));
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return doctors;
    return doctors.filter(
      (d) =>
        (d.name || '').toLowerCase().includes(term) ||
        (d.email || '').toLowerCase().includes(term) ||
        (d.specialization?.name || '').toLowerCase().includes(term)
    );
  }, [doctors, search]);

  // ------------------------------ Form helpers ------------------------------
  const openCreate = () => {
    setEditingDoctor(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (doctor) => {
    setEditingDoctor(doctor);
    setForm({
      name: doctor.name || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      password: '',
      specializationId: doctor.specialization?.id ?? '',
      qualification: doctor.qualification || '',
      experience: doctor.experience ?? '',
      consultationFee: doctor.consultationFee ?? '',
      bio: doctor.bio || '',
      status: doctor.status || 'approved',
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setFormError('Name, email and phone are required.');
      return;
    }
    if (!form.specializationId) {
      setFormError('Please select a specialization.');
      return;
    }
    if (!editingDoctor && (!form.password || form.password.length < 6)) {
      setFormError('A password of at least 6 characters is required.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      specializationId: Number(form.specializationId),
      qualification: form.qualification.trim(),
      experience: Number(form.experience) || 0,
      consultationFee: Number(form.consultationFee) || 0,
      bio: form.bio.trim(),
      status: form.status,
    };

    if (!editingDoctor) {
      payload.password = form.password;
    } else if (form.password) {
      payload.password = form.password;
    }

    setSaving(true);
    try {
      if (editingDoctor) {
        await adminService.updateDoctor(editingDoctor.id, payload);
        toast.success('Doctor updated successfully.');
      } else {
        await adminService.createDoctor(payload);
        toast.success('Doctor created successfully.');
      }
      setFormOpen(false);
      await loadDoctors();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------- Row level actions ---------------------------
  const approve = async (doctor, status) => {
    setBusyId(doctor.id);
    try {
      await adminService.approveDoctor(doctor.id, status);
      toast.success(`Doctor ${status}.`);
      await loadDoctors();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await adminService.deleteDoctor(deleteTarget.id);
      toast.success('Doctor deleted.');
      setDeleteTarget(null);
      await loadDoctors();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <h1>Manage Doctors</h1>
          <p>Approve, edit and maintain the doctor directory.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Add Doctor
        </button>
      </div>

      {error && <Alert type="error" message={error.message} onClose={() => setError('')} />}

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email or specialization..."
        status={statusFilter}
        statusOptions={STATUS_OPTIONS}
        onStatusChange={setStatusFilter}
        showStatus
        onReset={() => {
          setSearch('');
          setStatusFilter('');
        }}
      />

      {loading && <Loader text="Loading doctors..." />}

      {!loading && visible.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">&#129658;</div>
          <div className="empty-state-title">No doctors found</div>
          <p>Add a doctor or adjust your filters.</p>
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Doctor</th>
                <th scope="col">Contact</th>
                <th scope="col">Specialization</th>
                <th scope="col">Experience</th>
                <th scope="col">Fee</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((doctor) => (
                <tr key={doctor.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="avatar" aria-hidden="true">{initials(doctor.name)}</span>
                      <span>{doctor.name}</span>
                    </div>
                  </td>
                  <td>
                    <div>{doctor.email || '-'}</div>
                    <small className="text-muted">{doctor.phone || ''}</small>
                  </td>
                  <td>{doctor.specialization?.name || '-'}</td>
                  <td>{doctor.experience != null ? `${doctor.experience} yrs` : '-'}</td>
                  <td>₹{doctor.consultationFee ?? '-'}</td>
                  <td>
                    <span className={`badge ${statusClass(doctor.status)}`}>
                      {labelize(doctor.status || 'pending')}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => openEdit(doctor)}
                      >
                        Edit
                      </button>
                      {doctor.status !== 'approved' && (
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={busyId === doctor.id}
                          onClick={() => approve(doctor, 'approved')}
                        >
                          Approve
                        </button>
                      )}
                      {doctor.status !== 'rejected' && (
                        <button
                          type="button"
                          className="btn btn-warning btn-sm"
                          disabled={busyId === doctor.id}
                          onClick={() => approve(doctor, 'rejected')}
                        >
                          Reject
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={busyId === doctor.id}
                        onClick={() => setDeleteTarget(doctor)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------------------------- Create/Edit ---------------------------- */}
      <Modal
        open={formOpen}
        title={editingDoctor ? 'Edit Doctor' : 'Add Doctor'}
        size="lg"
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setFormOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" form="doctor-form" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader size="sm" inline /> : editingDoctor ? 'Save Changes' : 'Create Doctor'}
            </button>
          </>
        }
      >
        {formError && <Alert type="error" message={formError} onClose={() => setFormError('')} />}

        <form id="doctor-form" onSubmit={handleSave} noValidate>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="md-name">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="md-name"
                name="name"
                className="form-control"
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="md-email">
                Email <span className="required">*</span>
              </label>
              <input
                id="md-email"
                name="email"
                type="email"
                className="form-control"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="md-phone">
                Phone <span className="required">*</span>
              </label>
              <input
                id="md-phone"
                name="phone"
                className="form-control"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="md-password">
                Password {editingDoctor ? '(leave blank to keep)' : <span className="required">*</span>}
              </label>
              <input
                id="md-password"
                name="password"
                type="password"
                className="form-control"
                value={form.password}
                onChange={handleChange}
                placeholder={editingDoctor ? 'Unchanged' : 'At least 6 characters'}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="md-spec">
                Specialization <span className="required">*</span>
              </label>
              <select
                id="md-spec"
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
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="md-qualification">Qualification</label>
              <input
                id="md-qualification"
                name="qualification"
                className="form-control"
                value={form.qualification}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="md-experience">Experience (years)</label>
              <input
                id="md-experience"
                name="experience"
                type="number"
                min="0"
                className="form-control"
                value={form.experience}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="md-fee">Consultation Fee (₹)</label>
              <input
                id="md-fee"
                name="consultationFee"
                type="number"
                min="0"
                className="form-control"
                value={form.consultationFee}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="md-status">Status</label>
            <select
              id="md-status"
              name="status"
              className="form-select"
              value={form.status}
              onChange={handleChange}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{labelize(opt)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="md-bio">Short Bio</label>
            <textarea
              id="md-bio"
              name="bio"
              className="form-control"
              value={form.bio}
              onChange={handleChange}
            />
          </div>
        </form>
      </Modal>

      {/* ------------------------------ Delete ------------------------------ */}
      <Modal
        open={Boolean(deleteTarget)}
        title="Delete doctor"
        size="sm"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setDeleteTarget(null)}
              disabled={busyId === deleteTarget?.id}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={confirmDelete}
              disabled={busyId === deleteTarget?.id}
            >
              {busyId === deleteTarget?.id ? <Loader size="sm" inline /> : 'Delete'}
            </button>
          </>
        }
      >
        <p className="mb-0">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This
          action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
