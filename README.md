<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

# 📅 CalClo — Scheduling Platform

A full-stack scheduling and booking web application that replicates Calendly's design, user experience, and core functionality. Users can create event types, configure their availability, and share public booking pages where invitees can schedule meetings.

> **SDE Intern Fullstack Assignment** — Built with a strictly separated frontend + backend architecture.

---

## 🔗 Live Demo

| | Link | Description |
|---|---|---|
| 🖥️ **Dashboard** | [calendly-clone-psi-eight.vercel.app](https://calendly-clone-psi-eight.vercel.app/) | Admin dashboard — manage event types, meetings, availability |
| 📆 **Public Booking** | [calendly-clone-psi-eight.vercel.app/om](https://calendly-clone-psi-eight.vercel.app/om) | Public-facing booking page for user **OM** |
| 📋 **Meetings** | [calendly-clone-psi-eight.vercel.app/meetings](https://calendly-clone-psi-eight.vercel.app/meetings) | View upcoming/past meetings, cancel & reschedule |
| ⏰ **Availability** | [calendly-clone-psi-eight.vercel.app/availability](https://calendly-clone-psi-eight.vercel.app/availability) | Configure weekly hours, date overrides, buffer times |
| 👥 **Contacts** | [calendly-clone-psi-eight.vercel.app/contacts](https://calendly-clone-psi-eight.vercel.app/contacts) | Contacts / CRM management |

> [!NOTE]
> The backend is hosted on Render's free tier and may take **~30 seconds** to wake up on first visit. A toast notification will appear while the server spins up.

---

## 📸 Screenshots

<p align="center">
  <img src="./screenshots/dashboard.png" alt="Scheduling Dashboard" width="800" />
  <br><em>Scheduling Dashboard — Event type management with search, CRUD, and bulk operations</em>
</p>

<p align="center">
  <img src="./screenshots/public-booking.png" alt="Public Booking Page" width="800" />
  <br><em>Public Booking Page — Invitees select an event type to schedule</em>
</p>

<p align="center">
  <img src="./screenshots/meetings.png" alt="Meetings Dashboard" width="800" />
  <br><em>Meetings Dashboard — Tabbed view with reschedule, cancel, export, and date filtering</em>
</p>

<p align="center">
  <img src="./screenshots/availability.png" alt="Availability Settings" width="800" />
  <br><em>Availability Settings — Weekly hours, timezone selection, and copy-to-days</em>
</p>

---

## 📑 Table of Contents

- [Live Demo](#-live-demo)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Features](#-features-implemented)
- [Architecture](#-architecture)
- [Design Decisions](#-design-decisions--trade-offs)
- [Known Limitations](#️-known-limitations)
- [Prerequisites](#-prerequisites)
- [Setup Instructions](#-setup-instructions)
- [Seeded Data](#-seeded-data)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Testing](#-testing-the-application)
- [Deployment](#-deployment)

---

## 🛠 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (App Router), React, TypeScript, Tailwind CSS | 16, 19, TS 5+, v4 |
| **Backend** | Node.js, Express, TypeScript | Express 5, TS 5+ |
| **Database** | PostgreSQL + Prisma ORM | PG 14+, Prisma 5 |
| **Hosting** | Vercel (frontend) · Render (backend) · Supabase (database) | — |
| **Key Libraries** | Axios, date-fns, date-fns-tz, Lucide Icons | — |

---

## ✅ Features Implemented

| # | Feature | Highlights |
|---|---------|------------|
| 1 | **Event Type Management** | Full CRUD with custom URL slugs (`/:username/:slug`), active/inactive toggle, search, bulk operations, duplicate support |
| 2 | **Availability Settings** | Weekly schedules with multiple intervals/day, 23 timezone options, copy-hours-to-other-days, date-specific overrides |
| 3 | **Public Booking Page** | Calendar with month navigation, real-time slot generation, timezone-aware display, booking form (name, email, notes), confirmation page |
| 4 | **Meetings Dashboard** | Tabbed view (Upcoming/Past/Date Range), dual-month date picker with presets, cancel/reschedule actions, CSV export |
| 5 | **Database Design** | Normalized PostgreSQL schema (10 models), composite indexes, DB-level exclusion constraint for double-booking prevention |
| 6 | **REST API** | Clean layered architecture (Routes → Controllers → Services → Prisma), typed error classes, global error handler |
| 7 | **Rescheduling** | Secure UID-based flow; atomically soft-cancels old booking + creates new one in a single DB transaction |
| 8 | **Buffer Times** | Configurable before/after event buffers respected in both slot generation and conflict checks |
| 9 | **Date Overrides** | Override weekly rules for specific dates (holidays, custom hours); empty intervals = fully unavailable |
| 10 | **Advanced Scheduling Settings** | Minimum notice period, maximum days in advance, start time increments, back-to-back toggle |
| 11 | **Contacts/CRM** | Contacts management page for organizing invitee records |
| 12 | **CSV Export** | Export filtered bookings as downloadable CSV from the Meetings dashboard |

---

## 🏗 Architecture

### System Overview

```
┌─────────────────────────────┐           ┌──────────────────────────────────────┐
│       FRONTEND (Next.js)    │           │         BACKEND (Express)            │
│                             │  Axios    │                                      │
│  (admin) Route Group        │ ────────► │  Routes                              │
│  ├── / (Dashboard)          │  REST     │  ├── eventTypes.routes.ts            │
│  ├── /meetings              │   API     │  ├── availability.routes.ts          │
│  ├── /availability          │           │  ├── bookings.routes.ts              │
│  └── /contacts              │           │  └── public.routes.ts               │
│                             │           │           │                          │
│  (public) Route Group       │           │           ▼                          │
│  ├── /[username]            │           │  Controllers (request parsing)       │
│  ├── /[username]/[slug]     │           │           │                          │
│  ├── /[username]/[slug]/book│           │           ▼                          │
│  └── /reschedule/[uid]      │           │  Services  (business logic)          │
│                             │           │           │                          │
│  lib/api.ts (typed client)  │           │           ▼                          │
│  types/*.ts (interfaces)    │           │  Prisma ORM → PostgreSQL             │
└─────────────────────────────┘           └──────────────────────────────────────┘
```

### Double-Booking Prevention — 3-Layer Strategy

This is the most critical piece of the backend. A single-layer check is vulnerable to race conditions (TOCTOU), so three independent layers ensure correctness:

| Layer | Mechanism | What It Catches |
|-------|-----------|-----------------|
| **1. Database** | PostgreSQL `EXCLUDE USING gist` constraint | Two concurrent INSERTs that both passed application checks — the DB rejects the second one |
| **2. Application** | `SELECT ... FOR UPDATE` row lock on the host's User record | Serializes concurrent requests so only one processes at a time per host |
| **3. Business Logic** | Explicit overlap query with buffer window math inside the transaction | Validates the slot is actually free, accounting for before/after buffer times |

```
Request A ──┐                    Request B ──┐
            │                                │
            ▼                                ▼
    Lock User Row ◄─── Layer 2 ───► Waits for A's lock
            │
    Check overlaps ◄── Layer 3
            │
    INSERT booking
            │
    Release lock ────────────────► B acquires lock
                                        │
                                 Check overlaps ◄── Layer 3 (finds A's booking)
                                        │
                                 REJECT ← 409 Conflict
```

---

## 🧠 Design Decisions & Trade-offs

### 1. Local Time Strings for Availability

**Decision:** Availability intervals store times as local strings (`"09:00"`, `"17:00"`) in the host's timezone, not as UTC timestamps.

**Why:** If a host in `America/New_York` sets availability to 9 AM–5 PM, and DST shifts the UTC offset from -5 to -4, storing UTC would silently shift their local hours. Storing `"09:00"` as a string preserves the host's *intent*. The conversion to UTC happens only at slot-generation time using `date-fns-tz`.

### 2. Denormalized `userId` on the Booking Table

**Decision:** The `Booking` model has its own `userId` column, even though it could be derived via `Booking → EventType → User`.

**Why:** PostgreSQL's `EXCLUDE` constraint requires all referenced columns to be local to the table — it cannot join across tables. Without a local `userId`, the DB-level double-booking prevention layer would be impossible. The column is immutable after creation, so there's no update-anomaly risk.

### 3. Soft-Cancel Instead of Hard Delete for Cancelled Bookings

**Decision:** Cancelling a booking sets `status = 'CANCELLED'` instead of deleting the row.

**Why:** Preserves audit history for the Meetings dashboard (past tab) and enables the reschedule flow (which needs to reference the original booking). The `EXCLUDE` constraint's `WHERE status = 'SCHEDULED'` filter ensures cancelled bookings don't block new ones.

### 4. Mock Authentication over JWT

**Decision:** Auth middleware simply finds the first user in the database rather than implementing JWT/sessions.

**Why:** The assignment explicitly states *"Assume a default user is logged in"*. Building a real auth system would add complexity without testing core scheduling logic. The mock is cleanly isolated in `src/middleware/auth.ts` and can be swapped with minimal changes.

### 5. Atomic Availability Upsert with $transaction

**Decision:** The availability update deletes ALL existing day/interval rules and re-creates them inside a single `$transaction`.

**Why:** Partial updates to a graph of models (Schedule → Days → Intervals) are error-prone and create edge cases around orphaned intervals. The "delete-all-then-insert" pattern is simpler, idempotent, and guaranteed atomic. If the transaction fails mid-way, the old rules remain intact.

### 6. Express 5 (Latest)

**Decision:** Using Express 5.x instead of the widely-used Express 4.x.

**Why:** Express 5 automatically catches rejected promises in async route handlers and forwards them to the error handler. This eliminates the need for `try/catch` wrappers or `asyncHandler` utilities in every controller method, reducing boilerplate significantly.

---

## ⚠️ Known Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| **No email notifications** | Invitees don't receive booking confirmations via email | Confirmation page displays all details; a Nodemailer/Resend integration would be needed for production |
| **Mock authentication** | No real user management or multi-user support | By design per assignment spec; the `adminAuth` middleware is a single-file swap to integrate JWT |
| **No WebSocket real-time updates** | If two browsers view the same calendar, stale slots aren't pushed | The frontend uses 15-second polling + visibility/focus event refetching as a practical alternative |
| **Single-user system** | Only one host user (seeded admin) can manage events | The schema and API already support multi-user — only auth and user registration are missing |
| **No automated testing** | Core business logic isn't covered by unit tests | Manually tested all flows; services are cleanly separated and fully testable |

---

## 📋 Prerequisites

- **Node.js** v18+
- **PostgreSQL** 14+ (with `btree_gist` extension support)
- **npm** (comes with Node.js)

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/omgomji/Calendly-Clone.git
cd Calendly-Clone
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (copy from `.env.example`):

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/calclo_clone?schema=public"
PORT=5000
```

Initialize the database:

```bash
# Push the Prisma schema to PostgreSQL
npx prisma db push

# Add the exclusion constraint for double-booking prevention
npx ts-node prisma/setup-constraints.ts

# Seed sample data (user, event types, availability, bookings)
npx prisma db seed
```

> [!WARNING]
> The `setup-constraints.ts` step is critical — it creates a PostgreSQL exclusion constraint (`EXCLUDE USING gist`) that prevents overlapping bookings at the database level. This requires the `btree_gist` extension, which is auto-enabled by the script.

Start the backend dev server:

```bash
npm run dev
```

The API server starts at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env.local` file (copy from `.env.example`):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the frontend dev server:

```bash
npm run dev
```

Visit `http://localhost:3000` to see the admin dashboard.

### 4. Quick Walkthrough

| Step | Action |
|------|--------|
| **1** | Open `http://localhost:3000` — the **Event Types** dashboard loads |
| **2** | Click **"View booking page"** on any event card to open the public booking link |
| **3** | Or navigate directly to `http://localhost:3000/om/15-min-chat` (seeded username = `om`) |
| **4** | Select a date → pick a time slot → fill in name + email → submit |
| **5** | See the **confirmation page** with meeting details |
| **6** | Go to the **Meetings** tab (`http://localhost:3000/meetings`) to view/cancel/reschedule |
| **7** | Go to the **Availability** tab to modify working hours, set date overrides, or configure buffers |

---

## 🗃 Seeded Data

The database seed (`npx prisma db seed`) creates:

| Entity | Details |
|--------|---------|
| **User** | OM (`username: om`, `email: om@example.com`, timezone: `Asia/Kolkata`) |
| **Event Types** | 15 Min Chat, 30 Min Meeting, 60 Min Deep Dive |
| **Availability** | Mon–Fri, 9:00 AM – 5:00 PM IST (Friday ends at 4:00 PM); 15-min before/after buffers |
| **Bookings** | 4 sample bookings (2 upcoming, 1 past, 1 cancelled) |
| **Contacts** | 3 sample contacts for the CRM page |

---

## 📡 API Endpoints

**Base URL (local):** `http://localhost:5000/api`

### Admin Routes (Protected — mock auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/event-types` | List all event types for the logged-in user |
| `POST` | `/api/event-types` | Create a new event type |
| `PUT` | `/api/event-types/:id` | Update an event type (title, slug, duration, etc.) |
| `DELETE` | `/api/event-types/:id` | Delete event type and associated bookings |
| `GET` | `/api/availability` | Get the user's availability schedule |
| `PUT` | `/api/availability` | Create or update the availability schedule |
| `GET` | `/api/bookings` | List meetings (`?status=upcoming\|past`, `?from=`, `?to=`, `?q=`) |
| `GET` | `/api/bookings/export` | Download bookings as CSV |
| `POST` | `/api/bookings/:id/cancel` | Soft-cancel a scheduled meeting |
| `GET` | `/api/contacts` | List all contacts |
| `POST` | `/api/contacts` | Create a contact |
| `PUT` | `/api/contacts/:id` | Update a contact |
| `DELETE` | `/api/contacts/:id` | Delete a contact |

### Public Routes (No auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/public/:username` | Public profile with active event types |
| `GET` | `/api/public/:username/:slug` | Event type details for the booking page |
| `GET` | `/api/public/:username/:slug/slots?date=YYYY-MM-DD` | Available time slots for a given date |
| `POST` | `/api/public/:username/:slug/book` | Create a new booking |
| `GET` | `/api/public/reschedule/:uid/details` | Get existing booking details for rescheduling |
| `POST` | `/api/public/reschedule/:uid` | Reschedule an existing booking |

---

## 📁 Project Structure

```
Calendly-Clone/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema (10 models, indexes, constraints)
│   │   ├── seed.ts                  # Sample data seeder
│   │   └── setup-constraints.ts     # PostgreSQL EXCLUDE constraint setup
│   ├── src/
│   │   ├── config/
│   │   │   └── prisma.ts            # Singleton Prisma client
│   │   ├── controllers/
│   │   │   ├── availability.controller.ts
│   │   │   ├── bookings.controller.ts
│   │   │   ├── eventTypes.controller.ts
│   │   │   └── public.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts              # Mock auth (swappable with JWT)
│   │   │   └── errorHandler.ts      # Global error handler
│   │   ├── routes/
│   │   │   ├── availability.routes.ts
│   │   │   ├── bookings.routes.ts
│   │   │   ├── eventTypes.routes.ts
│   │   │   └── public.routes.ts
│   │   ├── services/
│   │   │   ├── availability.service.ts   # Schedule CRUD (atomic upsert)
│   │   │   ├── bookings.service.ts       # Booking + conflict prevention
│   │   │   ├── eventTypes.service.ts     # Event type CRUD
│   │   │   ├── public.service.ts         # Public page data helpers
│   │   │   └── slots.service.ts          # Timezone-aware slot generation
│   │   ├── utils/
│   │   │   ├── errors.ts                 # Typed error classes (AppError, NotFoundError, etc.)
│   │   │   └── csv.utils.ts              # CSV export helper
│   │   └── index.ts                      # Express app entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (admin)/                  # Protected admin pages
│   │   │   │   ├── page.tsx              # Event Types dashboard
│   │   │   │   ├── meetings/page.tsx     # Meetings dashboard
│   │   │   │   ├── availability/page.tsx # Availability settings
│   │   │   │   └── contacts/page.tsx     # Contacts CRM
│   │   │   ├── (public)/                 # Public booking pages
│   │   │   │   ├── [username]/[slug]/    # Booking calendar + form + success
│   │   │   │   └── reschedule/[uid]/     # Reschedule flow
│   │   │   └── layout.tsx                # Root layout with sidebar nav
│   │   ├── components/                   # Shared UI components
│   │   ├── lib/
│   │   │   └── api.ts                    # Typed Axios API client
│   │   └── types/                        # TypeScript interfaces
│   ├── .env.example
│   ├── next.config.ts
│   └── package.json
│
├── screenshots/                          # App screenshots for README
├── .gitignore
└── README.md
```

---

## 🧪 Testing the Application

### Manual Test Scenarios

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| **Create Event Type** | Dashboard → New → Fill form → Save | New card appears in the event list |
| **Book a Meeting** | Public page → Select date → Pick slot → Submit form | Confirmation page shows; booking appears in Meetings |
| **Double-Booking** | Open two tabs, select same slot, submit both | First succeeds (201), second gets 409 Conflict error |
| **Cancel Meeting** | Meetings tab → Click "Cancel" on a booking | Status changes to Cancelled; slot reopens for others |
| **Reschedule** | Meetings tab → Click "Reschedule" → Pick new slot | Old booking cancelled, new booking created |
| **Set Availability** | Availability tab → Modify hours → Save | New hours reflected in public booking page |
| **Date Override** | Availability tab → Calendar → Click a date → Set custom hours | That specific date uses override hours instead of weekly rules |
| **Buffer Times** | Availability → Advanced Settings → Set 15-min buffers | Slots near existing bookings become unavailable |

### Build Verification

```bash
# Backend — type check
cd backend && npx tsc --noEmit

# Frontend — type check + production build
cd frontend && npm run build
```

Both commands should complete with **zero errors**.

---

## 🚢 Deployment

The application is deployed using:

| Service | Role | URL |
|---------|------|-----|
| **Vercel** | Frontend hosting (Next.js) | [calendly-clone-psi-eight.vercel.app](https://calendly-clone-psi-eight.vercel.app/) |
| **Render** | Backend hosting (Express API) | Free-tier web service |
| **Supabase** | PostgreSQL database | Managed cloud Postgres |

### Environment Variables

**Frontend (Vercel):**
```env
NEXT_PUBLIC_API_URL=https://<your-render-url>/api
```

**Backend (Render):**
```env
DATABASE_URL=postgresql://<supabase-connection-string>
PORT=5000
```

---

## 🙏 Acknowledgements

- [Calendly](https://calendly.com) — for the UI/UX inspiration
- [Next.js](https://nextjs.org) · [Express](https://expressjs.com) · [Prisma](https://prisma.io) · [PostgreSQL](https://postgresql.org) — the incredible open-source stack
- [Lucide Icons](https://lucide.dev) — beautiful open-source icon set
- [date-fns](https://date-fns.org) — modern JavaScript date utility library

---

<p align="center">
  Made with ❤️ by <strong>OM</strong>
</p>
