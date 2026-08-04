import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Hashes a plain-text value using bcrypt with a cost factor of 10.
 */
export const hash = async (value: string): Promise<string> => {
  return bcrypt.hash(value, SALT_ROUNDS);
};

/**
 * Compares a plain-text value against a bcrypt hash.
 */
export const verifyHash = async (value: string, hashed: string): Promise<boolean> => {
  return bcrypt.compare(value, hashed);
};
