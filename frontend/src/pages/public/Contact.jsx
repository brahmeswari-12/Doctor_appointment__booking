import { useState } from 'react';
import Alert from '../../components/Alert.jsx';

const INITIAL_FORM = { name: '', email: '', subject: '', message: '' };

// Contact page with a client-side validated form (no backend submission).
export default function Contact() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name.';
    if (!form.email.trim()) next.email = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.message.trim()) next.message = 'Please enter your message.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Demo only: simulate a successful submission.
    setSubmitted(true);
    setForm(INITIAL_FORM);
  };

  return (
    <div className="container section-padding">
      <div className="page-header">
        <h1 className="page-title">Contact Us</h1>
        <p className="page-subtitle">
          Have a question or need help with your booking? Send us a message.
        </p>
      </div>

      <div className="split split-sidebar">
        <div className="card">
          {submitted && (
            <Alert
              type="success"
              message="Thank you! Your message has been received. We will get back to you shortly."
              onClose={() => setSubmitted(false)}
            />
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="contact-name">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  id="contact-name"
                  name="name"
                  className="form-control"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact-email">
                  Email <span className="required">*</span>
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contact-subject">Subject</label>
              <input
                id="contact-subject"
                name="subject"
                className="form-control"
                value={form.subject}
                onChange={handleChange}
                placeholder="How can we help?"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contact-message">
                Message <span className="required">*</span>
              </label>
              <textarea
                id="contact-message"
                name="message"
                className="form-control"
                value={form.message}
                onChange={handleChange}
                placeholder="Write your message here..."
              />
              {errors.message && <span className="form-error">{errors.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-lg">Send Message</button>
          </form>
        </div>

        <aside className="card">
          <h2 className="card-title">Get in touch</h2>
          <div className="detail-list mt-4">
            <div className="detail-row">
              <span className="detail-label">Phone</span>
              <span className="detail-value">+91 12345 67890</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email</span>
              <span className="detail-value">support@medicare.example</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Address</span>
              <span className="detail-value">123 Health Street, Wellness City</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Support Hours</span>
              <span className="detail-value">Mon - Sat, 9:00 AM - 6:00 PM</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
