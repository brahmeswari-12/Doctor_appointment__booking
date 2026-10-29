import { Link } from 'react-router-dom';

// Site footer shown on public pages.
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>MediCare</h4>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
              Book appointments with trusted, verified doctors. Simple, fast and secure
              healthcare scheduling for everyone.
            </p>
          </div>

          <div>
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/doctors">Find Doctors</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4>Account</h4>
            <ul className="footer-links">
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
              <li><Link to="/forgot-password">Forgot Password</Link></li>
            </ul>
          </div>

          <div>
            <h4>Contact</h4>
            <ul className="footer-links">
              <li><a href="tel:+911234567890">+91 12345 67890</a></li>
              <li><a href="mailto:support@medicare.example">support@medicare.example</a></li>
              <li>123 Health Street, Wellness City</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {year} MediCare. All rights reserved.</span>
          <span>Built for better healthcare access.</span>
        </div>
      </div>
    </footer>
  );
}
