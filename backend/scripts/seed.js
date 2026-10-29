/**
 * Seeds the database with an admin, sample doctors (with weekly schedules),
 * patients and a few appointments. Safe to re-run: existing users are skipped.
 * Usage: npm run db:seed
 */
require('dotenv').config();

const { pool } = require('../config/db');
const { hashPassword } = require('../utils/password');

const SPECIALIZATIONS = [
  ['Cardiologist', 'Heart and cardiovascular care, blood pressure and cholesterol management.'],
  ['Dermatologist', 'Skin, hair and nail conditions, allergies and cosmetic dermatology.'],
  ['Neurologist', 'Brain, spine and nervous system disorders including migraine and epilepsy.'],
  ['Orthopedic', 'Bones, joints and muscles, fractures, arthritis and sports injuries.'],
  ['Pediatrician', 'Child healthcare, vaccinations, growth and developmental checks.'],
  ['Dentist', 'Oral hygiene, tooth decay, root canal treatment and dental surgery.'],
  ['Gynecologist', 'Women health, pregnancy care and reproductive system conditions.'],
  ['General Physician', 'General health check-ups, fever, infections and preventive care.'],
  ['ENT Specialist', 'Ear, nose and throat disorders, sinus and hearing problems.'],
  ['Ophthalmologist', 'Eye care, vision correction, cataracts and retinal conditions.'],
];

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const WEEKDAYS_SAT = [...WEEKDAYS, 'Saturday'];

// Reusable weekly availability presets so different doctors have different
// "today" availability (useful for demoing the slot status on doctor cards).
const SCHEDULE_PRESETS = {
  FULLDAY: { days: WEEKDAYS, start: '09:00', end: '17:00' },
  MORNING: { days: WEEKDAYS_SAT, start: '08:00', end: '13:00' },
  AFTERNOON: { days: WEEKDAYS, start: '13:00', end: '18:00' },
  EVENING: { days: WEEKDAYS_SAT, start: '16:00', end: '20:00' },
  MWF: { days: ['Monday', 'Wednesday', 'Friday'], start: '10:00', end: '16:00' },
  TTH: { days: ['Tuesday', 'Thursday', 'Saturday'], start: '09:00', end: '15:00' },
};

// 24 doctors spread across the 10 specializations (2-3 per specialization).
// The first five keep FULLDAY hours so the sample appointments below stay valid.
const DOCTORS = [
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@doccare.com',
    phone: '+1 212 555 0101',
    specialization: 'Cardiologist',
    qualification: 'MD, FACC - Harvard Medical School',
    experience: 14,
    consultationFee: 180,
    bio: 'Board certified cardiologist focused on preventive cardiology, heart rhythm management and lifestyle medicine.',
    schedule: 'FULLDAY',
  },
  {
    name: 'Robert Chen',
    email: 'robert.chen@doccare.com',
    phone: '+1 617 555 0142',
    specialization: 'Dermatologist',
    qualification: 'MD, FAAD - Johns Hopkins University',
    experience: 10,
    consultationFee: 140,
    bio: 'Clinical dermatologist treating eczema, psoriasis, acne and performing skin cancer screenings.',
    schedule: 'FULLDAY',
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@doccare.com',
    phone: '+1 415 555 0198',
    specialization: 'Pediatrician',
    qualification: 'MD - Stanford University School of Medicine',
    experience: 8,
    consultationFee: 120,
    bio: 'Compassionate pediatrician dedicated to child wellness, immunization and adolescent development.',
    schedule: 'FULLDAY',
  },
  {
    name: 'Michael Brown',
    email: 'michael.brown@doccare.com',
    phone: '+1 312 555 0176',
    specialization: 'General Physician',
    qualification: 'MBBS, MD - Columbia University',
    experience: 16,
    consultationFee: 100,
    bio: 'Primary care physician with a focus on chronic disease management and preventive medicine.',
    schedule: 'FULLDAY',
  },
  {
    name: 'Jessica Taylor',
    email: 'jessica.taylor@doccare.com',
    phone: '+1 310 555 0155',
    specialization: 'Neurologist',
    qualification: 'MD, PhD - UCLA Medical School',
    experience: 12,
    consultationFee: 220,
    bio: 'Neurologist specialising in migraine, sleep disorders and neuromuscular diagnostics.',
    schedule: 'FULLDAY',
  },

  /* ----------------------------- Cardiologist ---------------------------- */
  {
    name: 'Daniel Foster',
    email: 'daniel.foster@doccare.com',
    phone: '+1 212 555 0210',
    specialization: 'Cardiologist',
    qualification: 'MD, DM (Cardiology) - Mayo Clinic',
    experience: 11,
    consultationFee: 200,
    bio: 'Interventional cardiologist performing angioplasty and managing coronary artery disease.',
    schedule: 'MORNING',
  },
  {
    name: 'Aisha Rahman',
    email: 'aisha.rahman@doccare.com',
    phone: '+1 212 555 0211',
    specialization: 'Cardiologist',
    qualification: 'MD, FACC - Yale School of Medicine',
    experience: 9,
    consultationFee: 160,
    bio: 'Heart failure and echocardiography specialist with a patient-first approach.',
    schedule: 'AFTERNOON',
  },

  /* ----------------------------- Dermatologist --------------------------- */
  {
    name: 'Laura Mitchell',
    email: 'laura.mitchell@doccare.com',
    phone: '+1 617 555 0220',
    specialization: 'Dermatologist',
    qualification: 'MD, FAAD - NYU Langone',
    experience: 13,
    consultationFee: 150,
    bio: 'Cosmetic and medical dermatologist specialising in acne scars and laser therapy.',
    schedule: 'MORNING',
  },
  {
    name: 'Kevin Park',
    email: 'kevin.park@doccare.com',
    phone: '+1 617 555 0221',
    specialization: 'Dermatologist',
    qualification: 'MD - University of Michigan',
    experience: 7,
    consultationFee: 130,
    bio: 'Dermatologist focused on pediatric skin conditions and hair loss treatment.',
    schedule: 'EVENING',
  },

  /* ------------------------------ Neurologist ---------------------------- */
  {
    name: 'Priya Nair',
    email: 'priya.nair@doccare.com',
    phone: '+1 310 555 0230',
    specialization: 'Neurologist',
    qualification: 'MD, DM (Neurology) - Johns Hopkins',
    experience: 15,
    consultationFee: 240,
    bio: 'Epilepsy and stroke specialist running a dedicated headache clinic.',
    schedule: 'MWF',
  },

  /* ------------------------------ Orthopedic ----------------------------- */
  {
    name: 'Thomas Wright',
    email: 'thomas.wright@doccare.com',
    phone: '+1 312 555 0240',
    specialization: 'Orthopedic',
    qualification: 'MS (Orthopedics), FRCS - Duke University',
    experience: 18,
    consultationFee: 210,
    bio: 'Joint replacement and sports injury surgeon with two decades of experience.',
    schedule: 'FULLDAY',
  },
  {
    name: 'Meera Iyer',
    email: 'meera.iyer@doccare.com',
    phone: '+1 312 555 0241',
    specialization: 'Orthopedic',
    qualification: 'MS (Orthopedics) - AIIMS',
    experience: 9,
    consultationFee: 170,
    bio: 'Orthopedic surgeon specialising in arthroscopy and spine care.',
    schedule: 'TTH',
  },

  /* ------------------------------ Pediatrician --------------------------- */
  {
    name: 'Hannah Lee',
    email: 'hannah.lee@doccare.com',
    phone: '+1 415 555 0250',
    specialization: 'Pediatrician',
    qualification: 'MD, FAAP - University of California',
    experience: 12,
    consultationFee: 125,
    bio: 'Pediatrician experienced in newborn care, growth monitoring and childhood allergies.',
    schedule: 'MORNING',
  },
  {
    name: 'Carlos Mendes',
    email: 'carlos.mendes@doccare.com',
    phone: '+1 415 555 0251',
    specialization: 'Pediatrician',
    qualification: 'MD - Baylor College of Medicine',
    experience: 6,
    consultationFee: 110,
    bio: 'Friendly pediatrician focused on adolescent health and preventive vaccinations.',
    schedule: 'AFTERNOON',
  },

  /* -------------------------------- Dentist ------------------------------ */
  {
    name: 'Rachel Adams',
    email: 'rachel.adams@doccare.com',
    phone: '+1 312 555 0260',
    specialization: 'Dentist',
    qualification: 'DDS, MDS - University of Pennsylvania',
    experience: 11,
    consultationFee: 95,
    bio: 'General and cosmetic dentist offering implants, whitening and painless root canals.',
    schedule: 'FULLDAY',
  },
  {
    name: 'Arjun Kapoor',
    email: 'arjun.kapoor@doccare.com',
    phone: '+1 312 555 0261',
    specialization: 'Dentist',
    qualification: 'BDS, MDS (Orthodontics)',
    experience: 8,
    consultationFee: 120,
    bio: 'Orthodontist specialising in braces, clear aligners and jaw alignment.',
    schedule: 'EVENING',
  },

  /* ----------------------------- Gynecologist ---------------------------- */
  {
    name: 'Olivia Bennett',
    email: 'olivia.bennett@doccare.com',
    phone: '+1 212 555 0270',
    specialization: 'Gynecologist',
    qualification: 'MD, MRCOG - King’s College London',
    experience: 14,
    consultationFee: 190,
    bio: 'Obstetrician and gynecologist supporting high-risk pregnancy and fertility care.',
    schedule: 'MORNING',
  },
  {
    name: 'Sneha Verma',
    email: 'sneha.verma@doccare.com',
    phone: '+1 212 555 0271',
    specialization: 'Gynecologist',
    qualification: 'MS (OBG) - Grant Medical College',
    experience: 10,
    consultationFee: 165,
    bio: 'Gynecologist focused on PCOS, adolescent health and minimally invasive surgery.',
    schedule: 'MWF',
  },

  /* --------------------------- General Physician ------------------------- */
  {
    name: 'Brian Cooper',
    email: 'brian.cooper@doccare.com',
    phone: '+1 617 555 0280',
    specialization: 'General Physician',
    qualification: 'MBBS, MRCP - University of Edinburgh',
    experience: 20,
    consultationFee: 90,
    bio: 'Family physician handling diabetes, hypertension and routine health screenings.',
    schedule: 'MORNING',
  },
  {
    name: 'Fatima Khan',
    email: 'fatima.khan@doccare.com',
    phone: '+1 617 555 0281',
    specialization: 'General Physician',
    qualification: 'MBBS, MD (Internal Medicine)',
    experience: 9,
    consultationFee: 105,
    bio: 'Internal medicine physician with a special interest in infectious diseases.',
    schedule: 'EVENING',
  },

  /* ----------------------------- ENT Specialist -------------------------- */
  {
    name: 'George Harris',
    email: 'george.harris@doccare.com',
    phone: '+1 415 555 0290',
    specialization: 'ENT Specialist',
    qualification: 'MS (ENT) - University of Toronto',
    experience: 13,
    consultationFee: 155,
    bio: 'ENT surgeon treating sinusitis, tonsillitis and voice disorders.',
    schedule: 'AFTERNOON',
  },
  {
    name: 'Ravi Menon',
    email: 'ravi.menon@doccare.com',
    phone: '+1 415 555 0291',
    specialization: 'ENT Specialist',
    qualification: 'MS (ENT), DNB - CMC Vellore',
    experience: 7,
    consultationFee: 135,
    bio: 'Otologist specialising in hearing loss, tinnitus and ear microsurgery.',
    schedule: 'TTH',
  },

  /* ---------------------------- Ophthalmologist -------------------------- */
  {
    name: 'Alice Turner',
    email: 'alice.turner@doccare.com',
    phone: '+1 310 555 0300',
    specialization: 'Ophthalmologist',
    qualification: 'MD, FICO - Wills Eye Hospital',
    experience: 16,
    consultationFee: 175,
    bio: 'Cataract and refractive surgeon with expertise in premium lens implants.',
    schedule: 'FULLDAY',
  },
  {
    name: 'Vikram Rao',
    email: 'vikram.rao@doccare.com',
    phone: '+1 310 555 0301',
    specialization: 'Ophthalmologist',
    qualification: 'MS (Ophthalmology) - LV Prasad Eye Institute',
    experience: 11,
    consultationFee: 145,
    bio: 'Retina specialist managing diabetic retinopathy and macular degeneration.',
    schedule: 'MORNING',
  },
];

const PATIENTS = [
  {
    name: 'John Miller',
    email: 'john.miller@example.com',
    phone: '+1 555 0100',
    dateOfBirth: '1988-04-12',
    gender: 'male',
    address: '221B Baker Street, London',
    medicalHistory: 'Mild hypertension, seasonal allergies.',
  },
  {
    name: 'Sophia Wilson',
    email: 'sophia.wilson@example.com',
    phone: '+1 555 0111',
    dateOfBirth: '1995-09-30',
    gender: 'female',
    address: '48 Maple Avenue, Boston',
    medicalHistory: 'No known chronic conditions.',
  },
  {
    name: 'David Anderson',
    email: 'david.anderson@example.com',
    phone: '+1 555 0122',
    dateOfBirth: '1979-01-22',
    gender: 'male',
    address: '12 Cedar Lane, Chicago',
    medicalHistory: 'Type 2 diabetes, controlled with medication.',
  },
];

function formatDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Returns a date string at least `minDaysAhead` days from now, skipping weekends. */
function upcomingWeekday(minDaysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + minDaysAhead);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return formatDate(date);
}

async function findId(table, column, value) {
  const [rows] = await pool.query(`SELECT id FROM ${table} WHERE ${column} = ? LIMIT 1`, [value]);
  return rows.length ? rows[0].id : null;
}

async function ensureSpecialization(name, description) {
  const existing = await findId('specializations', 'name', name);
  if (existing) return existing;

  const [result] = await pool.query(
    'INSERT INTO specializations (name, description) VALUES (?, ?)',
    [name, description]
  );
  return result.insertId;
}

async function ensureUser({ name, email, phone, password, role }) {
  const existing = await findId('users', 'email', email);
  if (existing) return existing;

  const hashed = await hashPassword(password);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, phone, hashed, role, 'active']
  );
  return result.insertId;
}

async function seedDoctor(doctor, specializationId) {
  const userId = await ensureUser({
    name: `Dr. ${doctor.name}`,
    email: doctor.email,
    phone: doctor.phone,
    password: 'Doctor@123',
    role: 'doctor',
  });

  let doctorId = await findId('doctors', 'user_id', userId);
  if (!doctorId) {
    const [result] = await pool.query(
      `INSERT INTO doctors
         (user_id, specialization_id, qualification, experience, consultation_fee, bio, status)
       VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
      [
        userId,
        specializationId,
        doctor.qualification,
        doctor.experience,
        doctor.consultationFee,
        doctor.bio,
      ]
    );
    doctorId = result.insertId;
  }

  const preset = SCHEDULE_PRESETS[doctor.schedule] || SCHEDULE_PRESETS.FULLDAY;
  await pool.query('DELETE FROM doctor_schedules WHERE doctor_id = ?', [doctorId]);
  for (const day of preset.days) {
    await pool.query(
      `INSERT INTO doctor_schedules (doctor_id, day, start_time, end_time, available)
       VALUES (?, ?, ?, ?, 1)`,
      [doctorId, day, preset.start, preset.end]
    );
  }

  return doctorId;
}

async function seedPatient(patient) {
  const userId = await ensureUser({
    ...patient,
    password: 'Patient@123',
    role: 'patient',
  });

  let patientId = await findId('patients', 'user_id', userId);
  if (!patientId) {
    const [result] = await pool.query(
      `INSERT INTO patients (user_id, date_of_birth, gender, address, medical_history)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, patient.dateOfBirth, patient.gender, patient.address, patient.medicalHistory]
    );
    patientId = result.insertId;
  }
  return patientId;
}

async function main() {
  console.log('[db:seed] Seeding specializations...');
  const specializationIds = {};
  for (const [name, description] of SPECIALIZATIONS) {
    specializationIds[name] = await ensureSpecialization(name, description);
  }

  console.log('[db:seed] Creating admin account...');
  await ensureUser({
    name: 'System Administrator',
    email: 'admin@doccare.com',
    phone: '+1 555 0000',
    password: 'Admin@123',
    role: 'admin',
  });

  console.log('[db:seed] Creating doctors and schedules...');
  const doctorIds = [];
  for (const doctor of DOCTORS) {
    doctorIds.push(await seedDoctor(doctor, specializationIds[doctor.specialization]));
  }

  console.log('[db:seed] Creating patients...');
  const patientIds = [];
  for (const patient of PATIENTS) {
    patientIds.push(await seedPatient(patient));
  }

  console.log('[db:seed] Creating sample appointments...');
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM appointments');
  if (Number(total) === 0) {
    const samples = [
      [patientIds[0], doctorIds[0], upcomingWeekday(1), '09:30:00', 'Routine heart check-up', 'confirmed'],
      [patientIds[1], doctorIds[1], upcomingWeekday(2), '11:00:00', 'Persistent skin rash', 'pending'],
      [patientIds[2], doctorIds[3], upcomingWeekday(3), '14:00:00', 'Diabetes follow-up', 'pending'],
      [patientIds[0], doctorIds[4], upcomingWeekday(4), '10:00:00', 'Recurring headaches', 'completed'],
    ];
    for (const sample of samples) {
      await pool.query(
        `INSERT INTO appointments
           (patient_id, doctor_id, appointment_date, appointment_time, reason, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        sample
      );
    }
  }

  console.log('[db:seed] Done.');
  console.log(`  ${DOCTORS.length} doctors seeded across ${SPECIALIZATIONS.length} specializations.`);
  console.log('  admin@doccare.com         / Admin@123');
  console.log('  sarah.johnson@doccare.com / Doctor@123  (every seeded doctor uses Doctor@123)');
  console.log('  john.miller@example.com   / Patient@123 (every seeded patient uses Patient@123)');
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('[db:seed] Failed:', err.message);
    await pool.end();
    process.exit(1);
  });
