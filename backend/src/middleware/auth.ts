import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

/**
 * Mock authentication middleware.
 *
 * In a production app this would decode a JWT or session cookie.
 * For this MVP we find the first user (the seeded admin) and attach it.
 */
export const adminAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findFirst();
    if (user) {
      (req as any).user = { id: user.id };
    } else {
      (req as any).user = { id: 1 }; // Fallback
    }
    next();
  } catch (error) {
    next(error);
  }
};
