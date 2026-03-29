/**
 * PostgreSQL Exclusion Constraint Setup
 *
 * This script applies the database-level exclusion constraint that
 * prevents overlapping SCHEDULED bookings for the same user.
 *
 * WHY THIS EXISTS:
 * Prisma cannot express PostgreSQL exclusion constraints in its schema DSL.
 * The application-layer $transaction check (in bookings.service.ts) catches
 * 99% of conflicts, but under high concurrency the TOCTOU race condition
 * means two transactions can both pass the SELECT check simultaneously.
 * The exclusion constraint is the database-level guarantee that prevents this.
 *
 * REQUIRES:
 *   - btree_gist extension (enables GiST index on scalar types)
 *   - userId column on bookings (added in schema_fixes.md)
 *
 * Run with: npx ts-node prisma/setup-constraints.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Setting up PostgreSQL exclusion constraint...');

  // Enable btree_gist extension — required for exclusion constraints
  // that combine scalar columns (userId) with range types (tstzrange)
  await prisma.$executeRawUnsafe(
    `CREATE EXTENSION IF NOT EXISTS btree_gist;`
  );
  console.log('  ✓ btree_gist extension enabled');

  // Drop existing constraint if re-running this script
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS no_overlapping_bookings;`
  );

  // Add the exclusion constraint:
  // For any given userId, no two SCHEDULED bookings can have overlapping
  // [startTime, endTime) time ranges.
  //
  // Column names match Prisma's default mapping (camelCase):
  //   model field "userId"    → column "userId"
  //   model field "startTime" → column "startTime"
  //   model field "endTime"   → column "endTime"
  //   enum value SCHEDULED    → stored as 'SCHEDULED'
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Booking"
    ADD CONSTRAINT no_overlapping_bookings
    EXCLUDE USING gist (
      "userId" WITH =,
      tsrange("startTime", "endTime") WITH &&
    )
    WHERE (status = 'SCHEDULED'::"BookingStatus");
  `);
  console.log('  ✓ Exclusion constraint no_overlapping_bookings applied');

  console.log('✅ Database constraints configured successfully!');
}

main()
  .catch((e) => {
    console.error('Setup error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
