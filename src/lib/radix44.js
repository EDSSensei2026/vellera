/**
 * Radix-44 Encoder — QR Alphanumeric Mode Optimized
 *
 * QR alphanumeric mode supports 45 chars: 0-9, A-Z, space, $, %, *, +, -, ., /, :
 * We use 44 of them (excluding space) for URL-safe, high-density encoding.
 *
 * Use case: Encoding session IDs, referral codes, and data-dense URL params
 * that need to stay compact inside QR codes.
 */

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$%*+-./:';
// 44 chars: 10 digits + 26 uppercase + 8 QR-safe symbols = 44

if (ALPHABET.length !== 44) {
  throw new Error(`Radix44 alphabet must be exactly 44 chars, got ${ALPHABET.length}`);
}

/**
 * Encode a non-negative integer to a Radix-44 string
 * @param {number} num - Non-negative integer
 * @param {number} [minLength=1] - Pad with leading '0' chars if shorter
 * @returns {string}
 */
export function encodeR44(num, minLength = 1) {
  if (!Number.isInteger(num) || num < 0) throw new Error('Input must be a non-negative integer');
  if (num === 0) return ALPHABET[0].padStart(minLength, ALPHABET[0]);

  let result = '';
  let n = num;
  while (n > 0) {
    result = ALPHABET[n % 44] + result;
    n = Math.floor(n / 44);
  }
  return result.padStart(minLength, ALPHABET[0]);
}

/**
 * Decode a Radix-44 string back to an integer
 * @param {string} str
 * @returns {number}
 */
export function decodeR44(str) {
  let result = 0;
  for (const char of str.toUpperCase()) {
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Invalid Radix-44 character: '${char}'`);
    result = result * 44 + idx;
  }
  return result;
}

/**
 * Generate a short Radix-44 referral/session code from a UUID or timestamp
 * @param {string} [seed] - Optional UUID string; defaults to Date.now()
 * @returns {string} 6-char code
 */
export function generateCode(seed) {
  const base = seed
    ? parseInt(seed.replace(/-/g, '').slice(0, 10), 16)
    : Date.now();
  return encodeR44(base % (44 ** 6), 6);
}

/**
 * Encode arbitrary string data as Radix-44 (for URL params / QR payloads)
 * Converts each char to its char code, encodes as R44, separated by '.'
 * @param {string} str
 * @returns {string}
 */
export function encodeStringR44(str) {
  return str.split('').map(c => encodeR44(c.charCodeAt(0), 2)).join('.');
}

/**
 * Decode a Radix-44 encoded string
 * @param {string} encoded
 * @returns {string}
 */
export function decodeStringR44(encoded) {
  return encoded.split('.').map(chunk => String.fromCharCode(decodeR44(chunk))).join('');
}

export { ALPHABET as R44_ALPHABET };