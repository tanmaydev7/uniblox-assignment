import { discountCodes } from '../db/schema/discountCodes';
import { eq } from 'drizzle-orm';
import type { db } from '../db';

type Database = typeof db;

const DISCOUNT_CODE_LENGTH = 8;
const MAX_GENERATION_ATTEMPTS = 100;
const DISCOUNT_PERCENT = 10;

/**
 * Generates a random alphanumeric discount code
 */
export const generateDiscountCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < DISCOUNT_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Generates a unique discount code that doesn't exist in the database
 */
export const generateUniqueDiscountCode = async (
  tx: Database
): Promise<string | null> => {
  let attempts = 0;

  while (attempts < MAX_GENERATION_ATTEMPTS) {
    const code = generateDiscountCode();
    const existingCode = await tx
      .select()
      .from(discountCodes)
      .where(eq(discountCodes.code, code))
      .limit(1);

    if (existingCode.length === 0) {
      return code;
    }

    attempts++;
  }

  console.error('Failed to generate unique discount code after multiple attempts');
  return null;
};

/**
 * Creates a discount code for a user's nth order
 */
export const createDiscountCodeForNthOrder = async (
  tx: Database,
  userId: number,
  orderNumber: number
): Promise<string | null> => {
  const uniqueCode = await generateUniqueDiscountCode(tx);

  if (!uniqueCode) {
    return null;
  }

  await tx.insert(discountCodes).values({
    code: uniqueCode,
    userId,
    orderNumber,
    discountPercent: DISCOUNT_PERCENT,
    isUsed: false,
    isGlobalOrder: false,
  });

  return uniqueCode;
};

/**
 * Creates a global discount code for a specific global order number
 * This code can be used by any user for that specific global order number
 */
export const createGlobalDiscountCode = async (
  tx: Database,
  orderNumber: number,
  discountPercent: number = DISCOUNT_PERCENT
): Promise<string | null> => {
  const uniqueCode = await generateUniqueDiscountCode(tx);

  if (!uniqueCode) {
    return null;
  }

  await tx.insert(discountCodes).values({
    code: uniqueCode,
    userId: null,
    orderNumber,
    discountPercent,
    isUsed: false,
    isGlobalOrder: true,
  });

  return uniqueCode;
};

