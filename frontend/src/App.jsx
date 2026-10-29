import AppRoutes from './routes/AppRoutes.jsx';
import ToastContainer from './components/ToastContainer.jsx';

// Root application component.
export default function App() {
  return (
    <>
      <AppRoutes />
      <ToastContainer />
    </>
  );
}
