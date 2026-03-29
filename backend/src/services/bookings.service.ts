/**
 * Bookings Service
 *
 * Handles meeting queries (dashboard) and booking creation (public flow).
 * The booking creation uses layered conflict protection:
 *   Layer 1 (lock): transaction-level host row lock (FOR UPDATE)
 *   Layer 2 (app):  overlap SELECT with buffer windows
 *   Layer 3 (DB):   PostgreSQL EXCLUDE constraint for raw overlap safety
 */
import { prisma } from '../config/prisma';
import { addMinutes, subMinutes } from 'date-fns';
import { NotFoundError, ConflictError } from '../utils/errors';

export const bookingsService = {
  /**
   * Fetch bookings for the admin dashboard.
   *
   * Filtering logic:
   *   - 'upcoming': startTime >= NOW() AND status = 'SCHEDULED'
   *   - 'past':     startTime < NOW() (includes CANCELLED — admin sees full history)
   *   - omitted:    all bookings (no filter)
   *
   * Always includes the related eventType for display (title, slug, duration).
   */
  async findByUser(
    userId: number,
    filters?: {
      status?: string;
      from?: string;
      to?: string;
      q?: string;
      eventTypeId?: number;
    }
  ) {
    const status = filters?.status;
    const now = new Date();

    const where: any = {
      eventType: { userId },
    };

    if (status === 'upcoming') {
      where.startTime = { gte: now };
      where.status = 'SCHEDULED';
    } else if (status === 'past') {
      where.startTime = { lt: now };
    } else if (status) {
      where.status = String(status).toUpperCase();
    }

    if (filters?.from || filters?.to) {
      where.startTime = {
        ...(where.startTime || {}),
        ...(filters?.from ? { gte: new Date(filters.from) } : {}),
        ...(filters?.to ? { lte: new Date(filters.to) } : {}),
      };
    }

    if (filters?.eventTypeId) {
      where.eventTypeId = filters.eventTypeId;
    }

    if (filters?.q) {
      const query = filters.q.trim();
      if (query) {
        where.OR = [
          { inviteeName: { contains: query, mode: 'insensitive' } },
          { inviteeEmail: { contains: query, mode: 'insensitive' } },
          { eventType: { title: { contains: query, mode: 'insensitive' } } },
        ];
      }
    }

    let orderBy: any = { startTime: 'asc' };
    if (status === 'past') {
      orderBy = { startTime: 'desc' };
    }

    return prisma.booking.findMany({
      where,
      include: {
        eventType: {
          select: { id: true, title: true, slug: true, duration: true },
        },
      },
      orderBy,
    });
  },

  /**
   * Soft-cancel a booking (SCHEDULED → CANCELLED).
   *
   * Ownership is verified through the booking's eventType.userId,
   * not through booking.userId — this matches the admin's perspective
   * of "my meetings" via the event types they own.
   *
   * Cancelling frees the slot: overlap checks filter on status='SCHEDULED' only.
   * Re-cancelling is idempotent (no guard in MVP per API contract).
   */
  async cancel(userId: number, bookingId: number) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { eventType: true },
    });

    if (!booking || booking.eventType.userId !== userId) {
      throw new NotFoundError('Booking not found');
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });
  },

  /**
   * Create a booking via the public booking flow.
   *
    * Double-booking prevention (defence in depth):
   *
    *   1. Host row lock (SELECT ... FOR UPDATE):
    *      Serializes booking writes per user so concurrent requests can't
    *      both pass overlap checks before either INSERT commits.
    *
    *   2. Application layer (same transaction):
    *      SELECT for overlapping SCHEDULED bookings scoped to userId,
    *      expanded by before/after buffer windows.
   *      If found → throw ConflictError (409).
   *      If none → INSERT.
    *
    *   3. Database layer (exclusion constraint):
    *      Still enforces raw timestamp overlaps as a final safety net.
   *
   * The userId is denormalised onto bookings specifically to enable
   * the user-scoped exclusion constraint (PG constraints can't span tables).
   */
  async createPublicBooking(
    userId: number,
    eventTypeId: number,
    duration: number,
    data: { inviteeName: string; inviteeEmail: string; startTime: string },
    options?: {
      beforeEventBufferMinutes?: number;
      afterEventBufferMinutes?: number;
    }
  ) {
    const startUtc = new Date(data.startTime);
    const endUtc = addMinutes(startUtc, duration);
    const beforeEventBufferMinutes = Math.max(
      0,
      options?.beforeEventBufferMinutes ?? 0
    );
    const afterEventBufferMinutes = Math.max(
      0,
      options?.afterEventBufferMinutes ?? 0
    );
    const totalBufferWindowMinutes =
      beforeEventBufferMinutes + afterEventBufferMinutes;
    const bufferedWindowStartUtc = subMinutes(startUtc, totalBufferWindowMinutes);
    const bufferedWindowEndUtc = addMinutes(endUtc, totalBufferWindowMinutes);

    return prisma.$transaction(async (tx) => {
      // Serialize booking writes per host to avoid race conditions for buffer windows.
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;

      // Check for overlapping bookings across ALL event types for this user
      const overlap = await tx.booking.findFirst({
        where: {
          userId,
          status: 'SCHEDULED',
          startTime: { lt: bufferedWindowEndUtc },
          endTime: { gt: bufferedWindowStartUtc },
        },
      });

      if (overlap) {
        throw new ConflictError('This time slot is no longer available');
      }

      return tx.booking.create({
        data: {
          eventTypeId,
          userId, // Denormalised — enables exclusion constraint + direct queries
          inviteeName: data.inviteeName,
          inviteeEmail: data.inviteeEmail,
          startTime: startUtc,
          endTime: endUtc,
          status: 'SCHEDULED',
        },
      });
    });
  },

  /**
   * Fetch booking details by UID for the public reschedule flow.
   */
  async getByUidRaw(uid: string) {
    const booking = await prisma.booking.findUnique({
      where: { uid },
      include: {
        eventType: true,
        user: true,
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    return booking;
  },

  /**
   * Reschedule a public booking. Soft-cancels the old booking and creates a new one.
   */
  async reschedulePublicBooking(
    uid: string,
    newStartTime: string,
    options?: {
      beforeEventBufferMinutes?: number;
      afterEventBufferMinutes?: number;
    }
  ) {
    const oldBooking = await prisma.booking.findUnique({
      where: { uid },
      include: { eventType: true },
    });

    if (!oldBooking) {
      throw new NotFoundError('Booking not found');
    }

    if (oldBooking.status === 'CANCELLED') {
      throw new ConflictError('This booking is already cancelled.');
    }

    const startUtc = new Date(newStartTime);
    const endUtc = addMinutes(startUtc, oldBooking.eventType.duration);
    
    const beforeEventBufferMinutes = Math.max(0, options?.beforeEventBufferMinutes ?? 0);
    const afterEventBufferMinutes = Math.max(0, options?.afterEventBufferMinutes ?? 0);
    const totalBufferWindowMinutes = beforeEventBufferMinutes + afterEventBufferMinutes;
    const bufferedWindowStartUtc = subMinutes(startUtc, totalBufferWindowMinutes);
    const bufferedWindowEndUtc = addMinutes(endUtc, totalBufferWindowMinutes);

    return prisma.$transaction(async (tx) => {
      // Serialize booking writes per host to avoid race conditions.
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${oldBooking.userId} FOR UPDATE`;

      // Cancel old booking
      await tx.booking.update({
        where: { id: oldBooking.id },
        data: { status: 'CANCELLED' },
      });

      // Check for overlaps (old booking is now CANCELLED, so it won't conflict)
      const overlap = await tx.booking.findFirst({
        where: {
          userId: oldBooking.userId,
          status: 'SCHEDULED',
          startTime: { lt: bufferedWindowEndUtc },
          endTime: { gt: bufferedWindowStartUtc },
        },
      });

      if (overlap) {
        throw new ConflictError('This time slot is no longer available');
      }

      // Create new booking with old details
      return tx.booking.create({
        data: {
          eventTypeId: oldBooking.eventTypeId,
          userId: oldBooking.userId,
          inviteeName: oldBooking.inviteeName,
          inviteeEmail: oldBooking.inviteeEmail,
          startTime: startUtc,
          endTime: endUtc,
          status: 'SCHEDULED',
        },
      });
    });
  },
};
