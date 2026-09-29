import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

/**
 * Password hashing using Node's built-in scrypt (no extra dependencies).
 * Format: "salt:hash" — both hex-encoded.
 */

const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const testBuf = scryptSync(password, salt, KEY_LEN);
  // timingSafeEqual prevents timing attacks on comparison.
  return hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf);
}
