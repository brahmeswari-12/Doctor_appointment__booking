const mysql = require('mysql2/promise');
const { hashPassword } = require('../utils/password');

async function seedCloud() {
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: 'w1pAVivR3bLut17.root',
    password: 'vCyJFrh9wU1G4u0v',
    database: 'doctor_appointment_db',
    ssl: { rejectUnauthorized: false }
  });
  
  // Seed specializations
  const specs = [
    ['Cardiologist', 'Heart and cardiovascular care, blood pressure and cholesterol management.'],
    ['Dermatologist', 'Skin, hair and nail conditions, allergies and cosmetic dermatology.'],
    ['Neurologist', 'Brain, spine and nervous system disorders including migraine and epilepsy.'],
    ['Orthopedic', 'Bones, joints and muscles, fractures, arthritis and sports injuries.'],
    ['Pediatrician', 'Child healthcare, vaccinations, growth and developmental checks.'],
    ['Dentist', 'Oral hygiene, tooth decay, root canal treatment and dental surgery.'],
    ['Gynecologist', 'Women health, pregnancy care and reproductive system conditions.'],
    ['General Physician', 'General health check-ups, fever, infections and preventive care.'],
    ['ENT Specialist', 'Ear, nose and throat disorders, sinus and hearing problems.'],
    ['Ophthalmologist', 'Eye care, vision correction, cataracts and retinal conditions.']
  ];
  for (const [name, desc] of specs) {
    await conn.query('INSERT IGNORE INTO specializations (name, description) VALUES (?, ?)', [name, desc]);
  }
  console.log('Specializations seeded in Cloud!');

  // Seed Admin
  const adminHash = await hashPassword('Admin@123');
  await conn.query(
    'INSERT IGNORE INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, "admin", "active")',
    ['System Admin', 'admin@doccare.com', '+91 99999 99999', adminHash]
  );
  console.log('Admin account created in Cloud!');

  const [tables] = await conn.query('SHOW TABLES');
  console.log('Cloud Tables:', tables.map(r => Object.values(r)[0]).join(', '));
  await conn.end();
}

seedCloud().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

