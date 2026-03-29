/**
 * Database Seed Script
 *
 * Populates the database with realistic sample data for development and demo:
 *   - 1 admin user (OM, username: admin)
 *   - Monday–Friday availability (9–5, Friday early finish at 4)
 *   - 3 event types (15 min, 30 min, 60 min)
 *   - 4 sample bookings (2 future, 1 past, 1 cancelled)
 *
 * Run with: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

const prisma = new PrismaClient();
const IST_TIMEZONE = 'Asia/Kolkata';

function toUtcFromIst(baseDate: Date, dayOffset: number, hhmm: string): Date {
  const shifted = addDays(baseDate, dayOffset);
  const datePart = formatInTimeZone(shifted, IST_TIMEZONE, 'yyyy-MM-dd');
  return fromZonedTime(`${datePart}T${hhmm}:00`, IST_TIMEZONE);
}

async function main() {
  console.log('🗑️  Clearing database...');
  await prisma.booking.deleteMany();
  await prisma.availabilityDateOverrideInterval.deleteMany();
  await prisma.availabilityDateOverride.deleteMany();
  await prisma.availabilityInterval.deleteMany();
  await prisma.availabilityDay.deleteMany();
  await prisma.availabilitySchedule.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.user.deleteMany();

  // ── User ───────────────────────────────────────────────────
  console.log('👤 Seeding user...');
  const user = await prisma.user.create({
    data: {
      username: 'om',
      name: 'OM',
      email: 'om@example.com',
      timezone: 'Asia/Kolkata',
    },
  });

  // ── Availability Schedule ──────────────────────────────────
  console.log('📅 Seeding availability schedule...');
  await prisma.availabilitySchedule.create({
    data: {
      userId: user.id,
      timezone: 'Asia/Kolkata',
      beforeEventBufferMinutes: 15,
      afterEventBufferMinutes: 15,
      startTimeIncrementMinutes: 30,
      minimumNoticeMinutes: 240,
      maximumDaysInFuture: 60,
      allowBackToBack: true,
      days: {
        create: [
          {
            dayOfWeek: 1,
            intervals: {
              create: [{ startTime: '09:00', endTime: '17:00', order: 0 }],
            },
          }, // Monday
          {
            dayOfWeek: 2,
            intervals: {
              create: [{ startTime: '09:00', endTime: '17:00', order: 0 }],
            },
          }, // Tuesday
          {
            dayOfWeek: 3,
            intervals: {
              create: [{ startTime: '09:00', endTime: '17:00', order: 0 }],
            },
          }, // Wednesday
          {
            dayOfWeek: 4,
            intervals: {
              create: [{ startTime: '09:00', endTime: '17:00', order: 0 }],
            },
          }, // Thursday
          {
            dayOfWeek: 5,
            intervals: {
              create: [{ startTime: '09:00', endTime: '16:00', order: 0 }],
            },
          }, // Friday (early finish)
        ],
      },
    },
  });

  // ── Event Types ────────────────────────────────────────────
  console.log('📝 Seeding event types...');
  const chat15 = await prisma.eventType.create({
    data: {
      userId: user.id,
      title: '15 Min Chat',
      slug: '15-min-chat',
      duration: 15,
      description: 'A quick 15-minute catch up.',
      isActive: true,
    },
  });

  const interview30 = await prisma.eventType.create({
    data: {
      userId: user.id,
      title: '30 Min Interview',
      slug: '30-min-interview',
      duration: 30,
      description: 'Standard 30-minute interview.',
      isActive: true,
    },
  });

  const deepDive60 = await prisma.eventType.create({
    data: {
      userId: user.id,
      title: '60 Min Deep Dive',
      slug: '60-min-deep-dive',
      duration: 60,
      description: 'In-depth technical discussion.',
      isActive: true,
    },
  });

  // ── Contacts ───────────────────────────────────────────────
  console.log('📇 Seeding contacts...');
  await prisma.contact.createMany({
    data: [
      {
        userId: user.id,
        name: 'John Smith',
        email: 'john@smith.com',
        phone: '+1 202-555-0101',
        note: 'Potential design partner for onboarding flow.',
      },
      {
        userId: user.id,
        name: 'Sarah Connor',
        email: 'sarah@connor.com',
        phone: '+1 202-555-0188',
        note: 'Follow up next week with architecture notes.',
      },
    ],
  });

  // ── Sample Bookings ────────────────────────────────────────
  console.log('📌 Seeding sample bookings...');
  const now = new Date();

  // Future booking 1 — tomorrow at 10:00 IST
  const tomorrow = toUtcFromIst(now, 1, '10:00');

  await prisma.booking.create({
    data: {
      eventTypeId: chat15.id,
      userId: user.id,
      inviteeName: 'John Smith',
      inviteeEmail: 'john@smith.com',
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 15 * 60_000),
      status: 'SCHEDULED',
    },
  });

  // Future booking 2 — day after tomorrow at 14:30 IST
  const dayAfter = toUtcFromIst(now, 2, '14:30');

  await prisma.booking.create({
    data: {
      eventTypeId: interview30.id,
      userId: user.id,
      inviteeName: 'Sarah Connor',
      inviteeEmail: 'sarah@connor.com',
      startTime: dayAfter,
      endTime: new Date(dayAfter.getTime() + 30 * 60_000),
      status: 'SCHEDULED',
    },
  });

  // Past booking — yesterday at 11:00 IST
  const yesterday = toUtcFromIst(now, -1, '11:00');

  await prisma.booking.create({
    data: {
      eventTypeId: interview30.id,
      userId: user.id,
      inviteeName: 'Alice Johnson',
      inviteeEmail: 'alice@johnson.com',
      startTime: yesterday,
      endTime: new Date(yesterday.getTime() + 30 * 60_000),
      status: 'SCHEDULED',
    },
  });

  // Cancelled booking — 2 days ago
  const twoDaysAgo = toUtcFromIst(now, -2, '15:00');

  await prisma.booking.create({
    data: {
      eventTypeId: chat15.id,
      userId: user.id,
      inviteeName: 'Bob Wilson',
      inviteeEmail: 'bob@wilson.com',
      startTime: twoDaysAgo,
      endTime: new Date(twoDaysAgo.getTime() + 15 * 60_000),
      status: 'CANCELLED',
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
