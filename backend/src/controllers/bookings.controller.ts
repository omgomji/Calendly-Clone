/**
 * Bookings Controller (Admin Dashboard)
 *
 * Handles listing meetings (upcoming/past) and cancelling bookings
 * for the logged-in admin user.
 */
import { Request, Response } from 'express';
import { bookingsService } from '../services/bookings.service';
import { BadRequestError } from '../utils/errors';
import { generateBookingsCsv } from '../utils/csv.utils';

export const bookingsController = {
  /** GET /api/bookings?status=upcoming|past */
  async getAll(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const status = req.query.status as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const q = req.query.q as string | undefined;
    const eventTypeIdRaw = req.query.eventTypeId as string | undefined;

    const eventTypeId = eventTypeIdRaw ? Number(eventTypeIdRaw) : undefined;
    if (eventTypeIdRaw && Number.isNaN(eventTypeId)) {
      throw new BadRequestError('Invalid eventTypeId');
    }

    if (from && Number.isNaN(new Date(from).getTime())) {
      throw new BadRequestError('Invalid from date');
    }

    if (to && Number.isNaN(new Date(to).getTime())) {
      throw new BadRequestError('Invalid to date');
    }

    const bookings = await bookingsService.findByUser(userId, {
      status,
      from,
      to,
      q,
      eventTypeId,
    });
    res.json(bookings);
  },

  /** GET /api/bookings/export */
  async exportCsv(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const status = req.query.status as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const q = req.query.q as string | undefined;
    const eventTypeIdRaw = req.query.eventTypeId as string | undefined;

    const eventTypeId = eventTypeIdRaw ? Number(eventTypeIdRaw) : undefined;
    if (eventTypeIdRaw && Number.isNaN(eventTypeId)) {
      throw new BadRequestError('Invalid eventTypeId');
    }

    const bookings = await bookingsService.findByUser(userId, {
      status,
      from,
      to,
      q,
      eventTypeId,
    });

    const csv = generateBookingsCsv(bookings);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.csv"');
    res.send(csv);
  },

  /** POST /api/bookings/:id/cancel */
  async cancel(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const id = Number(req.params.id);

    if (isNaN(id)) {
      throw new BadRequestError('Invalid booking ID');
    }

    const booking = await bookingsService.cancel(userId, id);
    res.json(booking);
  },
};
