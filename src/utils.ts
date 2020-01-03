/**
 * Some helper function for general use.
 *
 * @module src/utils
 */
const alnumChars = '0123456789' +
  'abcdefghijklmnopqrstuvwxyz' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generate alpha-numeric random string with given length. It is weakly
 * randomized, so it's not recommended for security use.
 *
 * @param length {number} length of string to generate.
 */
export function randomAlnumString(length: number) {
  let result = '';
  for (let i = 0; i < length; ++i)
    result += alnumChars[Math.floor(Math.random() * alnumChars.length)];
  return result;
}
