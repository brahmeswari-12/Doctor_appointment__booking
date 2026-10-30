require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { testConnection } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();
const PORT = Number(process.env.PORT || 5000);

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/** Allows the configured frontend origins, plus any localhost port in development. */
function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
  if (
    process.env.NODE_ENV !== 'production' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  ) {
    return callback(null, true);
  }
  return callback(new Error('Not allowed by CORS'));
}

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Welcome / root route so hitting the root URL shows a friendly status
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MediCare Doctor Appointment Booking API is running successfully!',
    health: '/api/health',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

// Simple liveness probe so you can confirm the API is up without a token.
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await testConnection();
    console.log(
      `[db] Connected to MySQL "${process.env.DB_NAME}" at ${process.env.DB_HOST}:${process.env.DB_PORT}`
    );
  } catch (err) {
    console.error('[db] Could not connect to MySQL:', err.message);
    console.error('     Check backend/.env DB_* values and that MySQL is running.');
  }

  app.listen(PORT, () => {
    console.log(`[api] Server running at http://localhost:${PORT}`);
    console.log(`[api] Health check:   http://localhost:${PORT}/api/health`);
  });
}

start();

module.exports = app;
