import { useCallback, useEffect, useMemo, useState } from 'react';
import adminService from '../../services/adminService.js';
import { useToastContext } from '../../context/ToastContext.jsx';
import { formatDate, statusClass, labelize } from '../../utils/helpers.js';
import SearchFilterBar from '../../components/SearchFilterBar.jsx';
import Modal from '../../components/Modal.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

// Admin: manage patient accounts (activate / deactivate / delete).
export default function ManagePatients() {
  const toast = useToastContext();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getPatients();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side filtering for a responsive feel.
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.email || '').toLowerCase().includes(term) ||
        (p.phone || '').toLowerCase().includes(term)
    );
  }, [patients, search]);

  const toggleStatus = async (patient) => {
    const nextStatus = patient.status === 'active' ? 'inactive' : 'active';
    setBusyId(patient.id);
    try {
      await adminService.updateUserStatus(patient.id, nextStatus);
      toast.success(`Patient ${nextStatus === 'active' ? 'activated' : 'deactivated'}.`);
      await load();
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
      await adminService.deleteUser(deleteTarget.id);
      toast.success('Patient deleted.');
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
          <h1>Manage Patients</h1>
          <p>View and manage registered patient accounts.</p>
        </div>
      </div>

      {error && <Alert type="error" message={error.message} onClose={() => setError('')} />}

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email or phone..."
        onReset={() => setSearch('')}
      />

      {loading && <Loader text="Loading patients..." />}

      {!loading && visible.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">&#128101;</div>
          <div className="empty-state-title">No patients found</div>
          <p>Try a different search term.</p>
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Registered</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((patient, index) => (
                <tr key={patient.id ?? index}>
                  <td>{index + 1}</td>
                  <td>{patient.name || '-'}</td>
                  <td>{patient.email || '-'}</td>
                  <td>{patient.phone || '-'}</td>
                  <td>{formatDate(patient.createdAt)}</td>
                  <td>
                    <span className={`badge ${statusClass(patient.status)}`}>
                      {labelize(patient.status || 'active')}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className={`btn btn-sm ${patient.status === 'active' ? 'btn-outline' : 'btn-success'}`}
                        disabled={busyId === patient.id}
                        onClick={() => toggleStatus(patient)}
                      >
                        {patient.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={busyId === patient.id}
                        onClick={() => setDeleteTarget(patient)}
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
        open={Boolean(deleteTarget)}
        title="Delete patient"
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
