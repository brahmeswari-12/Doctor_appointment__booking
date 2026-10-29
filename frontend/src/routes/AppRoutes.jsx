import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';

// Public pages
import Home from '../pages/public/Home.jsx';
import About from '../pages/public/About.jsx';
import Contact from '../pages/public/Contact.jsx';
import Login from '../pages/public/Login.jsx';
import Register from '../pages/public/Register.jsx';
import ForgotPassword from '../pages/public/ForgotPassword.jsx';
import DoctorList from '../pages/public/DoctorList.jsx';
import DoctorDetails from '../pages/public/DoctorDetails.jsx';

// Patient pages
import PatientDashboard from '../pages/patient/PatientDashboard.jsx';
import PatientProfile from '../pages/patient/PatientProfile.jsx';
import BookAppointment from '../pages/patient/BookAppointment.jsx';
import MyAppointments from '../pages/patient/MyAppointments.jsx';
import AppointmentHistory from '../pages/patient/AppointmentHistory.jsx';

// Doctor pages
import DoctorDashboard from '../pages/doctor/DoctorDashboard.jsx';
import DoctorProfile from '../pages/doctor/DoctorProfile.jsx';
import ManageSchedule from '../pages/doctor/ManageSchedule.jsx';
import DoctorAppointments from '../pages/doctor/DoctorAppointments.jsx';
import PatientDetails from '../pages/doctor/PatientDetails.jsx';

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import ManagePatients from '../pages/admin/ManagePatients.jsx';
import ManageDoctors from '../pages/admin/ManageDoctors.jsx';
import ManageSpecializations from '../pages/admin/ManageSpecializations.jsx';
import ManageAppointments from '../pages/admin/ManageAppointments.jsx';
import Reports from '../pages/admin/Reports.jsx';

// Simple 404 view.
function NotFound() {
  return (
    <div className="container section-padding text-center">
      <h1>404</h1>
      <p className="text-muted">The page you are looking for could not be found.</p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* ------------------------------ Public ------------------------------ */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/doctors" element={<DoctorList />} />
        <Route path="/doctors/:id" element={<DoctorDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* ------------------------------ Patient ----------------------------- */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute>
            <RoleRoute allow={['patient']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<PatientDashboard />} />
        <Route path="profile" element={<PatientProfile />} />
        <Route path="book" element={<BookAppointment />} />
        <Route path="appointments" element={<MyAppointments />} />
        <Route path="history" element={<AppointmentHistory />} />
      </Route>

      {/* ------------------------------- Doctor ----------------------------- */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute>
            <RoleRoute allow={['doctor']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<DoctorDashboard />} />
        <Route path="profile" element={<DoctorProfile />} />
        <Route path="schedule" element={<ManageSchedule />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="patients/:id" element={<PatientDetails />} />
        <Route path="patients" element={<PatientDetails />} />
      </Route>

      {/* -------------------------------- Admin ----------------------------- */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allow={['admin']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="patients" element={<ManagePatients />} />
        <Route path="doctors" element={<ManageDoctors />} />
        <Route path="specializations" element={<ManageSpecializations />} />
        <Route path="appointments" element={<ManageAppointments />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* ------------------------------- Fallback --------------------------- */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
