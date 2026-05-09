import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const HASH_ALGORITHM = "sha256";
const HASH_ITERATIONS = 100000;
const HASH_BYTES = 32;
const HASH_PREFIX = "pbkdf2_sha256";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_BYTES, HASH_ALGORITHM).toString("hex");
  return `${HASH_PREFIX}$${HASH_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [prefix, iterationsText, salt, hash] = storedHash.split("$");
  const iterations = Number(iterationsText);

  if (prefix !== HASH_PREFIX || !Number.isFinite(iterations) || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = pbkdf2Sync(password, salt, iterations, expected.length, HASH_ALGORITHM);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
