/**
 * Application Entry Point
 *
 * Bootstraps the Express 5 server with:
 *   - CORS (allow all origins for local dev)
 *   - JSON body parsing
 *   - Mock auth middleware on admin routes
 *   - Route mounting
 *   - Global error handler (must be last)
 *
 * Architecture:
 *   Routes → Controllers → Services → Prisma → PostgreSQL
 *
 * The PrismaClient singleton lives in src/config/prisma.ts
 * to avoid circular imports and multiple connection pools.
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import eventTypesRouter from './routes/eventTypes';
import availabilityRouter from './routes/availability';
import bookingsRouter from './routes/bookings';
import contactsRouter from './routes/contacts';
import publicRouter from './routes/public';
import { adminAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// ── Global Middleware ────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── Admin Routes ─────────────────────────────────────────────
// Protected by mock auth middleware that injects userId: 1.
// In production this would be JWT/session-based auth.
app.use('/api/event-types', adminAuth, eventTypesRouter);
app.use('/api/availability', adminAuth, availabilityRouter);
app.use('/api/bookings', adminAuth, bookingsRouter);
app.use('/api/contacts', adminAuth, contactsRouter);

// ── Public Routes ────────────────────────────────────────────
// No auth required — accessed by invitees via booking links.
app.use('/api/public', publicRouter);

// ── Global Error Handler ─────────────────────────────────────
// Must be registered LAST. Express 5 auto-forwards async errors here.
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────
app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
