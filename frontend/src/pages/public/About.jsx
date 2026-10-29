import { Link } from 'react-router-dom';

// Static informational page.
export default function About() {
  return (
    <div className="container section-padding">
      <div className="page-header">
        <h1 className="page-title">About MediCare</h1>
        <p className="page-subtitle">
          We connect patients with trusted doctors through a simple, transparent and
          reliable online appointment platform.
        </p>
      </div>

      <div className="grid grid-3 mb-5">
        <div className="info-card">
          <div className="info-card-icon" aria-hidden="true">&#127919;</div>
          <h3>Our Mission</h3>
          <p className="text-muted mb-0">
            Make quality healthcare accessible to everyone by removing the friction
            from booking an appointment.
          </p>
        </div>
        <div className="info-card">
          <div className="info-card-icon" aria-hidden="true">&#128101;</div>
          <h3>Our Team</h3>
          <p className="text-muted mb-0">
            A network of verified specialists and dedicated support staff committed to
            patient wellbeing.
          </p>
        </div>
        <div className="info-card">
          <div className="info-card-icon" aria-hidden="true">&#128274;</div>
          <h3>Your Privacy</h3>
          <p className="text-muted mb-0">
            Your medical information stays secure and is only shared with the doctors
            you choose to consult.
          </p>
        </div>
      </div>

      <div className="card">
        <h2>How it works</h2>
        <div className="grid grid-3 mt-4">
          <div>
            <h3>1. Create an account</h3>
            <p className="text-muted">
              Register as a patient in under a minute and complete your basic details.
            </p>
          </div>
          <div>
            <h3>2. Find your doctor</h3>
            <p className="text-muted">
              Search by name or filter by specialization to find the right expert.
            </p>
          </div>
          <div>
            <h3>3. Book &amp; manage</h3>
            <p className="text-muted">
              Pick an available slot, confirm your visit and manage everything from your
              dashboard.
            </p>
          </div>
        </div>

        <div className="form-actions">
          <Link to="/doctors" className="btn btn-primary">Find a Doctor</Link>
          <Link to="/contact" className="btn btn-outline">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
