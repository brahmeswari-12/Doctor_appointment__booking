import { useCallback, useEffect, useState } from 'react';
import adminService from '../../services/adminService.js';
import { useToastContext } from '../../context/ToastContext.jsx';
import Modal from '../../components/Modal.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

const EMPTY_FORM = { name: '', description: '' };

// Admin: CRUD for medical specializations.
export default function ManageSpecializations() {
  const toast = useToastContext();

  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getSpecializations();
      setSpecializations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (spec) => {
    setEditing(spec);
    setForm({ name: spec.name || '', description: spec.description || '' });
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

    if (!form.name.trim()) {
      setFormError('Name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() };
      if (editing) {
        await adminService.updateSpecialization(editing.id, payload);
        toast.success('Specialization updated.');
      } else {
        await adminService.createSpecialization(payload);
        toast.success('Specialization created.');
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await adminService.deleteSpecialization(deleteTarget.id);
      toast.success('Specialization deleted.');
      setDeleteTarget(null);
      await load();
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
          <h1>Manage Specializations</h1>
          <p>Define the medical categories patients can browse.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Add Specialization
        </button>
      </div>

      {error && <Alert type="error" message={error.message} onClose={() => setError('')} />}

      {loading && <Loader text="Loading specializations..." />}

      {!loading && specializations.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">&#127973;</div>
          <div className="empty-state-title">No specializations yet</div>
          <p>Add the first specialization to organise your doctors.</p>
        </div>
      )}

      {!loading && specializations.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Name</th>
                <th scope="col">Description</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {specializations.map((spec, index) => (
                <tr key={spec.id ?? index}>
                  <td>{index + 1}</td>
                  <td><strong>{spec.name}</strong></td>
                  <td className="text-muted">{spec.description || '-'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => openEdit(spec)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={busyId === spec.id}
                        onClick={() => setDeleteTarget(spec)}
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

      <Modal
        open={formOpen}
        title={editing ? 'Edit Specialization' : 'Add Specialization'}
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
            <button type="submit" form="spec-form" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader size="sm" inline /> : editing ? 'Save Changes' : 'Create'}
            </button>
          </>
        }
      >
        {formError && <Alert type="error" message={formError} onClose={() => setFormError('')} />}

        <form id="spec-form" onSubmit={handleSave} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="spec-name">
              Name <span className="required">*</span>
            </label>
            <input
              id="spec-name"
              name="name"
              className="form-control"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Cardiology"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="spec-desc">Description</label>
            <textarea
              id="spec-desc"
              name="description"
              className="form-control"
              value={form.description}
              onChange={handleChange}
              placeholder="Short description of this specialization"
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete specialization"
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
          Delete <strong>{deleteTarget?.name}</strong>? Doctors linked to this
          specialization may be affected.
        </p>
      </Modal>
    </div>
  );
}
