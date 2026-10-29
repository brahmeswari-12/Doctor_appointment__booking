import { formatDate, formatTime, statusClass, labelize, formatCurrency } from '../utils/helpers.js';
import Loader from './Loader.jsx';

/**
 * Responsive appointment table.
 *
 * @param {Array} appointments
 * @param {boolean} loading
 * @param {Function} renderActions - (appointment) => ReactNode
 * @param {boolean} showDoctor - show the doctor column (admin / patient view)
 * @param {boolean} showPatient - show the patient column (doctor / admin view)
 * @param {boolean} showPayment - show the payment column
 */
export default function AppointmentTable({
  appointments = [],
  loading = false,
  renderActions,
  showDoctor = true,
  showPatient = false,
  showPayment = true,
  emptyMessage = 'No appointments found.',
}) {
  if (loading) {
    return <Loader text="Loading appointments..." />;
  }

  if (!appointments.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon" aria-hidden="true">&#128197;</div>
        <div className="empty-state-title">Nothing here yet</div>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Date</th>
            <th scope="col">Time</th>
            {showPatient && <th scope="col">Patient</th>}
            {showDoctor && <th scope="col">Doctor</th>}
            <th scope="col">Specialization</th>
            <th scope="col">Reason</th>
            <th scope="col">Status</th>
            {showPayment && <th scope="col">Payment</th>}
            {renderActions && <th scope="col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt, index) => (
            <tr key={appt.id ?? index}>
              <td>{index + 1}</td>
              <td>{formatDate(appt.appointmentDate)}</td>
              <td>{formatTime(appt.appointmentTime)}</td>
              {showPatient && (
                <td>
                  <div>{appt.patientName || '-'}</div>
                  {appt.patientPhone && (
                    <small className="text-muted">{appt.patientPhone}</small>
                  )}
                </td>
              )}
              {showDoctor && <td>{appt.doctorName || '-'}</td>}
              <td>{appt.specializationName || '-'}</td>
              <td className="truncate" style={{ maxWidth: 200 }} title={appt.reason || ''}>
                {appt.reason || '-'}
              </td>
              <td>
                <span className={`badge ${statusClass(appt.status)}`}>
                  {labelize(appt.status)}
                </span>
              </td>
              {showPayment && (
                <td>
                  <span className={`badge ${statusClass(appt.paymentStatus)}`}>
                    {labelize(appt.paymentStatus || 'unpaid')}
                  </span>
                  {appt.amount > 0 && (
                    <div>
                      <small className="text-muted">
                        {formatCurrency(appt.amount)}
                        {appt.paymentMethod ? ` · ${labelize(appt.paymentMethod)}` : ''}
                      </small>
                    </div>
                  )}
                </td>
              )}
              {renderActions && (
                <td>
                  <div className="table-actions">{renderActions(appt)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
