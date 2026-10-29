# DocCare — Doctor Appointment Booking System

A full-stack doctor appointment booking platform with three role-based dashboards
(**Patient**, **Doctor**, **Admin**), JWT authentication and MySQL storage.

| Layer | Technology |
| --- | --- |
| Frontend | React 18 + Vite, React Router v6, Axios, plain CSS |
| Backend | Node.js + Express.js, REST API |
| Database | MySQL 8 |
| Auth | JSON Web Tokens (JWT) |
| Password security | bcrypt hashing (`bcryptjs`) |
| Validation | express-validator |
| Payments | Razorpay Orders API (built-in simulator when no keys are set) |

---

## 1. Project structure

```
doctor-appointment/
├── backend/
│   ├── config/          # MySQL connection pool + payment config
│   ├── controllers/     # thin HTTP layer (auth, patient, doctor, appointment, payment, admin)
│   ├── middleware/      # auth (JWT), role guard, validation, error handling
│   ├── models/          # SQL data access per entity
│   ├── routes/          # REST route definitions + input validation rules
│   ├── services/        # business logic
│   ├── utils/           # ApiError, asyncHandler, jwt, password, serializers, date helpers, razorpay client
│   ├── database/
│   │   └── schema.sql   # full MySQL schema (tables, FKs, indexes)
│   ├── scripts/
│   │   ├── initDb.js    # creates the database + tables (and migrates existing ones)
│   │   └── seed.js      # seeds admin, doctors, patients, appointments
│   ├── .env.example
│   ├── package.json
│   └── server.js        # Express app + boot
├── frontend/
│   ├── src/
│   │   ├── components/  # Navbar, Sidebar, DoctorCard, Modal, StatCard, ...
│   │   ├── pages/       # public / patient / doctor / admin pages
│   │   ├── layouts/     # PublicLayout, DashboardLayout
│   │   ├── services/    # axios instance + per-domain API clients
│   │   ├── context/     # AuthContext, ToastContext
│   │   ├── hooks/       # useAuth, useFetch
│   │   ├── routes/      # AppRoutes, ProtectedRoute, RoleRoute
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml   # optional: MySQL 8 in one command
└── README.md
```

---

## 2. Database design

```
users ──1:1── patients          users ──1:1── doctors ──*:1── specializations
                                               │
                                               └──1:*── doctor_schedules

patients ──1:*── appointments ──*:1── doctors
appointments ──1:*── payments
users ──1:*── password_resets
```

| Table | Purpose | Key columns |
| --- | --- | --- |
| `users` | Single auth table for all roles | `email` UNIQUE, `password` (bcrypt), `role`, `status` |
| `patients` | Patient profile | `user_id` UNIQUE FK → users |
| `specializations` | Doctor categories | `name` UNIQUE |
| `doctors` | Doctor profile | `user_id` UNIQUE FK, `specialization_id` FK, `status` (pending/approved/rejected) |
| `doctor_schedules` | Weekly availability | `(doctor_id, day)` UNIQUE, `start_time`, `end_time`, `available` |
| `appointments` | Bookings + payment summary | FKs to patients + doctors, `status`, `payment_status`, `payment_method`, `amount`, indexed on `(doctor_id, appointment_date)` |
| `payments` | Gateway transaction log | `appointment_id` FK, `provider_order_id` UNIQUE, `status`, `provider_payment_id` |
| `password_resets` | Forgot-password tokens | `token`, `expires_at`, `used` |

Indexes exist on `users.email`, `users.role`, `users.status`, `doctors.specialization_id`,
`doctors.status`, `appointments.patient_id`, `appointments.(doctor_id, appointment_date)`,
`appointments.status`, `appointments.payment_status`, `payments.provider_order_id` and
`password_resets.token`. Deleting a user cascades to their profile and appointments.

---

## 3. Prerequisites

- **Node.js** 18+ (tested on Node 24) and npm
- **MySQL 8** — either installed locally **or** run it with Docker (below)
- Docker Desktop (optional, only if you use the Docker MySQL)

---

## 4. Setup — step by step

### Step 1 — Install dependencies

From the project root:

```bash
npm run install:all
```

(or manually: `cd backend && npm install` and `cd frontend && npm install`)

### Step 2 — Start MySQL

**Option A — Docker (recommended, one command):**

```bash
npm run db:up
```

This starts MySQL 8 on `localhost:3306` with root password `rootpassword` and
automatically creates the schema on first run.

**Option B — Your own MySQL server:**

Make sure it is running, then create the database + tables (see Step 4):

```bash
mysql -u root -p < backend/database/schema.sql
```

### Step 3 — Configure `.env`

Copy the example and edit it:

```bash
cd backend
copy .env.example .env      # Windows (PowerShell: cp .env.example .env)
```

```env
PORT=5000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=rootpassword      # <-- your MySQL root password
DB_NAME=doctor_appointment_db

JWT_SECRET=change_this_to_a_long_random_secret_string
JWT_EXPIRES_IN=1d

CORS_ORIGIN=http://localhost:5173

# Payments — leave blank to use the built-in simulator (no account needed).
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
PAYMENT_CURRENCY=INR
```

> A ready-to-use `backend/.env` already ships. It is pre-set to
> `DB_PASSWORD=root` (a common local MySQL password). **If you use the Docker
> MySQL from Step 2, set `DB_PASSWORD=rootpassword`** so it matches
> `docker-compose.yml`. Otherwise set it to whatever your local MySQL root
> password is.

### Step 4 — Create the database schema

```bash
npm run db:init
```

### Step 5 — Seed demo data (optional but recommended)

```bash
npm run db:seed
```

Creates 10 specializations, 1 admin, **24 approved doctors (2–3 per specialization,
each with their own weekly hours)**, 3 patients and a few appointments. Every
seeded doctor uses the password `Doctor@123`.

### Step 6 — Start the backend

```bash
npm run backend
```

→ `http://localhost:5000` — verify with `http://localhost:5000/api/health`.

### Step 7 — Start the frontend

In a second terminal:

```bash
npm run frontend
```

→ open **http://localhost:5173**

---

## 5. Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@doccare.com` | `Admin@123` |
| Doctor | `sarah.johnson@doccare.com` | `Doctor@123` |
| Patient | `john.miller@example.com` | `Patient@123` |

You can also register a new Patient or Doctor from the UI. New doctor accounts
start with status **pending** and must be approved by the admin before patients can book them.

---

## 6. API reference

Base URL: `http://localhost:5000/api`
Every success response is `{ "success": true, "data": … }`; errors are
`{ "success": false, "message": "…" }`.

### Auth
| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/auth/register` | public |
| POST | `/auth/login` | public |
| GET | `/auth/me` | authenticated |
| POST | `/auth/forgot-password` | public |
| POST | `/auth/reset-password` | public |

### Patients
| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/patients/profile` | patient |
| PUT | `/patients/profile` | patient |
| GET | `/patients/appointments` | patient |

### Doctors
| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/doctors?search=&specializationId=` | public |
| GET | `/doctors/specializations` | public |
| GET | `/doctors/:id` | public |
| GET | `/doctors/:id/schedule` | public |
| GET | `/doctors/:id/slots?date=YYYY-MM-DD` | public |
| PUT | `/doctors/profile` | doctor |
| PUT | `/doctors/schedule` | doctor |

`GET /doctors` and `GET /doctors/:id` also return today's availability for each
doctor: `worksToday` (bool), `todaySlotCount` (free slots left), `todayTimings`
(e.g. `"09:00 - 17:00"`) and `todaySlots` (the remaining `"HH:MM"` times).

### Appointments
| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/appointments` | patient |
| GET | `/appointments?status=&filter=today\|upcoming\|past` | authenticated (role-scoped) |
| GET | `/appointments/:id` | owner / admin |
| PUT | `/appointments/:id` | cancel (patient) / status change (doctor) / reschedule (patient, admin) |
| DELETE | `/appointments/:id` | admin |

Every appointment carries `paymentStatus` (`unpaid` | `pending` | `paid` | `failed` | `refunded`),
`paymentMethod`, `amount`, `consultationFee`, `paymentReference` and `paidAt`.

### Payments
| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/payments/config` | authenticated |
| POST | `/payments/orders` | authenticated (body: `appointmentId`, `method`) |
| POST | `/payments/verify` | authenticated (body: `appointmentId`, `orderId`, `paymentId?`, `signature?`) |
| POST | `/payments/fail` | authenticated (body: `appointmentId`, `orderId`, `reason?`) |

Supported methods: `cash`, `card`, `upi`, `netbanking`, `wallet`. `cash` is settled
offline (the appointment stays `unpaid` until you collect it); the rest create a gateway
order and settle to `paid`.

### Admin
| Method | Endpoint |
| --- | --- |
| GET | `/admin/stats` |
| GET | `/admin/users?role=&search=` |
| GET | `/admin/patients?search=` |
| GET | `/admin/doctors?search=&status=` |
| GET | `/admin/appointments?status=&paymentStatus=&date=&doctorId=&patientId=` |
| POST | `/admin/doctors` |
| PUT | `/admin/doctors/:id` |
| PUT | `/admin/doctors/:id/approve` |
| DELETE | `/admin/doctors/:id` |
| PUT | `/admin/users/:id/status` |
| DELETE | `/admin/users/:id` |
| GET/POST | `/admin/specializations` |
| PUT/DELETE | `/admin/specializations/:id` |

`GET /admin/stats` also returns payment KPIs: `paidAppointments`, `unpaidAppointments`,
`refundedAppointments` and `totalRevenue`.

---

## 6b. Payments

Payments are handled by a small provider layer (`backend/config/payment.js` +
`backend/utils/razorpayClient.js`) that talks to the **Razorpay Orders API** over HTTPS
using Basic auth — no extra npm dependency.

- **Simulator mode (default):** if `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are blank,
  orders are simulated locally (`sim_order_…`) so the whole booking → payment flow works
  with **zero external accounts**. This is what the seeded demo runs on.
- **Live mode:** set both keys in `backend/.env` and the backend will create real Razorpay
  orders and verify the `HMAC-SHA256` payment signature before marking an appointment paid.
  The frontend then opens the Razorpay checkout.
- **Cash at clinic:** choosing `cash` does not contact any gateway — the appointment is
  booked immediately and marked `unpaid` for collection at reception.
- **Refunds:** cancelling an appointment that was already `paid` automatically marks it
  `refunded`.

Where it shows up in the UI: the booking page has a *Payment Method* step, *My Appointments*
has a **Pay Now** action plus a payment badge, tables show a *Payment* column, and the admin
dashboard shows revenue / paid / unpaid / refunded cards.

```bash
# check the current provider mode
curl http://localhost:5000/api/payments/config -H "Authorization: Bearer <token>"
```

---

## 7. Testing the application

1. Start MySQL, backend and frontend (Steps 1–7).
2. Open `http://localhost:5173`.
3. **Patient flow** — log in as `john.miller@example.com`, browse *Doctors*,
   open a doctor, pick a date, choose an available slot and book. Try cancelling
   and rescheduling from *My Appointments*.
4. **Payment flow** — when booking, continue to the *Payment Method* step and pick
   **UPI / Card / Net Banking / Wallet** → the appointment is created and marked **Paid**
   (simulated in demo mode). Book a second appointment with **Cash at Clinic** → it is
   marked **Unpaid**; use **Pay Now** in *My Appointments* to settle it later.
   Cancel a paid appointment → it flips to **Refunded**.
5. **Double-booking guard** — open the same doctor/date in a second browser
   (e.g. as `sophia.wilson@example.com`) and try to book the same slot → the API
   returns a `409` with a friendly message.
6. **Doctor flow** — log in as `sarah.johnson@doccare.com`, accept/reject pending
   requests, mark one as completed, and edit the weekly schedule.
7. **Admin flow** — log in as `admin@doccare.com`, review dashboard statistics
   (including revenue / paid / refunded cards), approve a newly registered doctor,
   add a specialization, filter appointments.
8. **Security check** — while logged in as a patient, call an admin endpoint
   directly (`GET /api/admin/users` with the patient token) → expect `403`.

Quick API smoke test with curl:

```bash
curl http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@doccare.com\",\"password\":\"Admin@123\"}"
```

---

## 8. Security notes

- Passwords are hashed with **bcrypt** (10 salt rounds) and never stored in plain text.
- **JWT** access tokens signed with `JWT_SECRET`; the secret and DB credentials live in `.env` (git-ignored).
- `authenticate` middleware verifies the token on every protected route and rejects deactivated accounts.
- `authorize(role)` middleware enforces role-based access — patients cannot reach doctor/admin APIs, and doctors cannot reach admin APIs.
- All request bodies are validated with **express-validator** before hitting controllers.
- Booking rules: past dates, out-of-hours times, unavailable days and already-booked slots (double booking) are rejected server-side.
- Password reset tokens are single-use and expire after one hour.
- Payment endpoints are authenticated and ownership-checked — a patient can only pay for
  their own appointments; the amount is resolved server-side (never trusted from the client).
- In live mode the Razorpay **secret key never leaves the backend**, and the payment
  signature is verified with a timing-safe comparison before an appointment is marked paid.
- `bcryptjs` is used instead of the native `bcrypt` package so no C++ build tools are required (same bcrypt algorithm and hash format).

---

## 9. Troubleshooting

| Problem | Fix |
| --- | --- |
| `Could not connect to MySQL` on boot | MySQL isn't running, or `DB_*` in `backend/.env` is wrong. Run `npm run db:up` or start your MySQL server. |
| `ER_BAD_DB_ERROR: Unknown database` | Run `npm run db:init` (or `mysql -u root -p < backend/database/schema.sql`). |
| Login fails after seeding | The seed script only inserts when the email doesn't already exist; delete the row or use the documented passwords. |
| CORS error in the browser | Set `CORS_ORIGIN` in `backend/.env` to your frontend URL (default `http://localhost:5173`). |
| Frontend can't reach the API | Confirm `frontend/.env` (copied from `.env.example`) has `VITE_API_URL=http://localhost:5000/api`. |
| Port already in use | Change `PORT` in `backend/.env`, or run the frontend on another port with `npm --prefix frontend run dev -- --port 5174`. |

---

## 10. Useful commands

```bash
npm run install:all   # install backend + frontend dependencies
npm run db:up         # start MySQL in Docker
npm run db:down       # stop MySQL
npm run db:init       # create database + tables
npm run db:seed       # insert demo data
npm run backend       # run the API (nodemon, http://localhost:5000)
npm run frontend      # run the React app (http://localhost:5173)
```
