/**
 * Availability Service
 *
 * Manages the host's weekly availability schedule.
 * Each user has at most one schedule containing 0–7 day rules.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

type AvailabilityIntervalInput = {
  startTime: string;
  endTime: string;
};

type AvailabilityDayInput = {
  dayOfWeek: number;
  intervals: AvailabilityIntervalInput[];
};

type AvailabilityDateOverrideInput = {
  date: string; // YYYY-MM-DD
  intervals: AvailabilityIntervalInput[];
};

const DAYS_INCLUDE = {
  include: {
    intervals: {
      orderBy: { order: 'asc' as const },
    },
  },
  orderBy: { dayOfWeek: 'asc' as const },
};

const DATE_OVERRIDES_INCLUDE = {
  include: {
    intervals: {
      orderBy: { order: 'asc' as const },
    },
  },
  orderBy: { date: 'asc' as const },
};

function toDateOnlyUtc(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function toYyyyMmDd(value: Date | string): string {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
}

function isLegacyBufferColumnError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== 'P2022') {
    return false;
  }

  const details = `${error.message} ${JSON.stringify(error.meta ?? {})}`;
  return (
    details.includes('beforeEventBufferMinutes') ||
    details.includes('afterEventBufferMinutes') ||
    details.includes('startTimeIncrementMinutes') ||
    details.includes('minimumNoticeMinutes') ||
    details.includes('maximumDaysInFuture') ||
    details.includes('allowBackToBack')
  );
}

async function findScheduleWithBuffers(client: any, userId: number) {
  return client.availabilitySchedule.findUnique({
    where: { userId },
    include: {
      days: DAYS_INCLUDE,
      dateOverrides: DATE_OVERRIDES_INCLUDE,
    },
  });
}

async function findLegacySchedule(client: any, userId: number) {
  return client.availabilitySchedule.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      timezone: true,
      days: DAYS_INCLUDE,
      dateOverrides: DATE_OVERRIDES_INCLUDE,
    },
  });
}

function withDefaultSettings<T extends Record<string, any> | null>(schedule: T) {
  if (!schedule) {
    return null;
  }

  return {
    ...schedule,
    beforeEventBufferMinutes: schedule.beforeEventBufferMinutes ?? 0,
    afterEventBufferMinutes: schedule.afterEventBufferMinutes ?? 0,
    startTimeIncrementMinutes: schedule.startTimeIncrementMinutes ?? 30,
    minimumNoticeMinutes: schedule.minimumNoticeMinutes ?? 0,
    maximumDaysInFuture: schedule.maximumDaysInFuture ?? 60,
    allowBackToBack: schedule.allowBackToBack ?? true,
  };
}

function withNormalizedDateOverrides<T extends Record<string, any> | null>(schedule: T) {
  if (!schedule) {
    return null;
  }

  if (!Array.isArray(schedule.dateOverrides)) {
    return schedule;
  }

  return {
    ...schedule,
    dateOverrides: schedule.dateOverrides.map((override: any) => ({
      ...override,
      date: toYyyyMmDd(override.date),
    })),
  };
}

async function replaceScheduleDays(
  tx: any,
  scheduleId: number,
  days: AvailabilityDayInput[]
) {
  await tx.availabilityInterval.deleteMany({
    where: { day: { scheduleId } },
  });
  await tx.availabilityDay.deleteMany({
    where: { scheduleId },
  });

  if (days.length === 0) {
    return;
  }

  for (const day of days) {
    const createdDay = await tx.availabilityDay.create({
      data: {
        scheduleId,
        dayOfWeek: day.dayOfWeek,
      },
    });

    if (day.intervals.length > 0) {
      await tx.availabilityInterval.createMany({
        data: day.intervals.map((interval, index) => ({
          dayId: createdDay.id,
          startTime: interval.startTime,
          endTime: interval.endTime,
          order: index,
        })),
      });
    }
  }
}

async function replaceScheduleDateOverrides(
  tx: any,
  scheduleId: number,
  dateOverrides: AvailabilityDateOverrideInput[]
) {
  await tx.availabilityDateOverrideInterval.deleteMany({
    where: { override: { scheduleId } },
  });
  await tx.availabilityDateOverride.deleteMany({
    where: { scheduleId },
  });

  if (dateOverrides.length === 0) {
    return;
  }

  for (const override of dateOverrides) {
    const createdOverride = await tx.availabilityDateOverride.create({
      data: {
        scheduleId,
        date: toDateOnlyUtc(override.date),
      },
    });

    if (override.intervals.length > 0) {
      await tx.availabilityDateOverrideInterval.createMany({
        data: override.intervals.map((interval, index) => ({
          overrideId: createdOverride.id,
          startTime: interval.startTime,
          endTime: interval.endTime,
          order: index,
        })),
      });
    }
  }
}

async function upsertInTransaction(
  tx: any,
  userId: number,
  timezone: string,
  days: AvailabilityDayInput[],
  dateOverrides: AvailabilityDateOverrideInput[] | undefined,
  options: {
    beforeEventBufferMinutes?: number;
    afterEventBufferMinutes?: number;
    startTimeIncrementMinutes?: number;
    minimumNoticeMinutes?: number;
    maximumDaysInFuture?: number;
    allowBackToBack?: boolean;
  } | undefined,
  supportsBufferColumns: boolean
) {
  let schedule = await tx.availabilitySchedule.findUnique({
    where: { userId },
  });

  if (!schedule) {
    const createData: any = {
      userId,
      timezone,
    };

    if (supportsBufferColumns) {
      createData.beforeEventBufferMinutes = options?.beforeEventBufferMinutes ?? 0;
      createData.afterEventBufferMinutes = options?.afterEventBufferMinutes ?? 0;
      createData.startTimeIncrementMinutes = options?.startTimeIncrementMinutes ?? 30;
      createData.minimumNoticeMinutes = options?.minimumNoticeMinutes ?? 0;
      createData.maximumDaysInFuture = options?.maximumDaysInFuture ?? 60;
      createData.allowBackToBack = options?.allowBackToBack ?? true;
    }

    schedule = await tx.availabilitySchedule.create({ data: createData });
  } else {
    const updateData: any = { timezone };
    if (supportsBufferColumns) {
      if (options?.beforeEventBufferMinutes !== undefined) {
        updateData.beforeEventBufferMinutes = options.beforeEventBufferMinutes;
      }
      if (options?.afterEventBufferMinutes !== undefined) {
        updateData.afterEventBufferMinutes = options.afterEventBufferMinutes;
      }
      if (options?.startTimeIncrementMinutes !== undefined) {
        updateData.startTimeIncrementMinutes = options.startTimeIncrementMinutes;
      }
      if (options?.minimumNoticeMinutes !== undefined) {
        updateData.minimumNoticeMinutes = options.minimumNoticeMinutes;
      }
      if (options?.maximumDaysInFuture !== undefined) {
        updateData.maximumDaysInFuture = options.maximumDaysInFuture;
      }
      if (options?.allowBackToBack !== undefined) {
        updateData.allowBackToBack = options.allowBackToBack;
      }
    }

    schedule = await tx.availabilitySchedule.update({
      where: { userId },
      data: updateData,
    });
  }

  await replaceScheduleDays(tx, schedule.id, days);
  if (dateOverrides !== undefined) {
    await replaceScheduleDateOverrides(tx, schedule.id, dateOverrides);
  }

  if (supportsBufferColumns) {
    const fullSchedule = await findScheduleWithBuffers(tx, userId);
    return withNormalizedDateOverrides(withDefaultSettings(fullSchedule));
  }

  const legacySchedule = await findLegacySchedule(tx, userId);
  return withNormalizedDateOverrides(withDefaultSettings(legacySchedule));
}

export const availabilityService = {
  /**
   * Fetch the user's availability schedule with all day rules.
   * Returns null if no schedule has been configured yet.
   */
  async getByUser(userId: number) {
    try {
      const schedule = await findScheduleWithBuffers(prisma, userId);
      return withNormalizedDateOverrides(withDefaultSettings(schedule));
    } catch (error) {
      if (!isLegacyBufferColumnError(error)) {
        throw error;
      }

      const legacySchedule = await findLegacySchedule(prisma, userId);
      return withNormalizedDateOverrides(withDefaultSettings(legacySchedule));
    }
  },

  /**
   * Create or fully replace the user's availability schedule.
   *
   * This is an idempotent upsert:
   *   - If no schedule exists → create it with the given days
   *   - If a schedule exists → update timezone, delete ALL old days, insert new ones
   *
   * ⚠️ CRITICAL: Wrapped in $transaction to ensure atomicity.
   * Without this, a crash between DELETE (old days) and INSERT (new days)
   * would leave the schedule in a broken state — valid header but zero days,
   * making the user appear completely unavailable with no UI indication.
   */
  async upsert(
    userId: number,
    timezone: string,
    days: AvailabilityDayInput[],
    options?: {
      beforeEventBufferMinutes?: number;
      afterEventBufferMinutes?: number;
      startTimeIncrementMinutes?: number;
      minimumNoticeMinutes?: number;
      maximumDaysInFuture?: number;
      allowBackToBack?: boolean;
      dateOverrides?: AvailabilityDateOverrideInput[];
    }
  ) {
    try {
      return await prisma.$transaction((tx) =>
        upsertInTransaction(
          tx,
          userId,
          timezone,
          days,
          options?.dateOverrides,
          options,
          true
        )
      );
    } catch (error) {
      if (!isLegacyBufferColumnError(error)) {
        throw error;
      }

      // Backward compatibility for local DBs not migrated yet.
      return prisma.$transaction((tx) =>
        upsertInTransaction(
          tx,
          userId,
          timezone,
          days,
          options?.dateOverrides,
          options,
          false
        )
      );
    }
  },
};
