/**
 * Public Routes
 *
 * These routes are accessed by invitees — no authentication required.
 * Scoped by :username/:slug to identify the host and event type.
 *
 * GET  /:username/:slug        → event type details (booking page header)
 * GET  /:username/:slug/slots  → available time slots for a date
 * POST /:username/:slug/book   → create a booking
 */
import { Router } from 'express';
import { publicController } from '../controllers/public.controller';

const router = Router();

router.get('/reschedule/:uid/details', publicController.getRescheduleDetails);
router.post('/reschedule/:uid', publicController.rescheduleBooking);

router.get('/:username', publicController.getPublicProfile);
router.get('/:username/:slug', publicController.getEventDetails);
router.get('/:username/:slug/slots', publicController.getSlots);
router.post('/:username/:slug/book', publicController.createBooking);

export default router;
