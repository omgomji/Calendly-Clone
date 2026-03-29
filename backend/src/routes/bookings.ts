/**
 * Bookings Routes (Admin Dashboard)
 *
 * GET  /             → list meetings (filterable by ?status=upcoming|past)
 * POST /:id/cancel   → soft-cancel a booking (state transition, not deletion)
 *
 * Protected by adminAuth middleware (applied at mount point in index.ts).
 */
import { Router } from 'express';
import { bookingsController } from '../controllers/bookings.controller';

const router = Router();

router.get('/', bookingsController.getAll);
router.get('/export', bookingsController.exportCsv);
router.post('/:id/cancel', bookingsController.cancel);

export default router;
