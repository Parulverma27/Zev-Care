/**
 * Password hashing utility using Node.js built-in crypto (scrypt).
 * No external dependency required.
 */

import crypto from 'crypto';

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

/**
 * Hash a plain-text password.
 * @param {string} password
 * @returns {Promise<string>} salt:hash hex string
 */
export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify a password against a stored hash.
 * @param {string} password - plain-text password
 * @param {string} storedHash - salt:hash from hashPassword()
 * @returns {Promise<boolean>}
 */
export function verifyPassword(password, storedHash) {
  return new Promise((resolve, reject) => {
    const [salt, hash] = storedHash.split(':');
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey.toString('hex') === hash);
    });
  });
}

