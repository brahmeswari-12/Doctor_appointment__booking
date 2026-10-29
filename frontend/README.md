# MediCare - Doctor Appointment Booking (Frontend)

A React (Vite) single-page application for booking doctor appointments. It
supports three roles: **patient**, **doctor** and **admin**, each with its own
dashboard.

## Tech Stack

- React 18 + Vite (JavaScript / JSX)
- react-router-dom v6
- axios
- React Context API (auth + toasts)
- Plain CSS (no UI framework)

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file from the example and point it at your backend:

   ```bash
   cp .env.example .env
   ```

   `.env`:

   ```
   VITE_API_URL=http://localhost:5000/api
   ```

3. Start the dev server (runs on http://localhost:5173):

   ```bash
   npm run dev
   ```

## Other Scripts

- `npm run build` - production build into `dist/`
- `npm run preview` - preview the production build locally

## Project Structure

```
src/
  components/   Reusable UI building blocks
  context/      AuthContext + ToastContext providers
  hooks/        useAuth, useFetch
  layouts/      PublicLayout (navbar) + DashboardLayout (sidebar)
  pages/        public / patient / doctor / admin screens
  routes/       AppRoutes, ProtectedRoute, RoleRoute
  services/     axios instance + API service modules
```

## Roles & Routing

- `/login` redirects to `/patient`, `/doctor` or `/admin` based on role.
- Protected routes require a JWT (stored in `localStorage`).
- Role routes guard dashboards so a user can only reach their own area.
