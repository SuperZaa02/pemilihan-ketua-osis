import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Password hashing memakai scrypt (bawaan Node.js, tanpa dependency).
 * Format tersimpan: scrypt$<N>$<r>$<p>$<salt-hex>$<hash-hex>
 * Format ini memungkinkan peningkatan parameter di masa depan
 * tanpa membatalkan hash lama.
 */

const N = 16384; // CPU/memory cost
const R = 8; // block size
const P = 1; // parallelization
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH, { N, r: R, p: P });
  return [
    "scrypt",
    N,
    R,
    P,
    salt.toString("hex"),
    hash.toString("hex"),
  ].join("$");
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");

  const actual = scryptSync(password, salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });

  return actual.length === expected.length
    && timingSafeEqual(actual, expected);
}
