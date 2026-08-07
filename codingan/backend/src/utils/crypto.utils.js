const CryptoJS = require('crypto-js');

const AES_KEY = process.env.AES_SECRET_KEY || 'ticketing_aes_256_secret_key_32ch';

/**
 * Encrypt QR token using AES-256
 * @param {object} payload - Data to encrypt (ticketId, userId, eventId, timestamp)
 * @returns {string} - Encrypted base64 string
 */
const encryptQRToken = (payload) => {
  const jsonString = JSON.stringify({
    ...payload,
    generatedAt: new Date().toISOString(),
    nonce: Math.random().toString(36).substring(2, 15),
  });
  // FIX: CryptoJS.AES.encrypt(...).toString() already returns OpenSSL Base64 string.
  // Do NOT wrap in Buffer base64 again, so frontend and Flutter can decrypt seamlessly.
  return CryptoJS.AES.encrypt(jsonString, AES_KEY).toString();
};

/**
 * Decrypt and validate QR token
 * @param {string} token - Base64 encoded encrypted token
 * @returns {object|null} - Decrypted payload or null if invalid
 */
const decryptQRToken = (token) => {
  try {
    // FIX: Handle direct CryptoJS AES decrypt
    const bytes = CryptoJS.AES.decrypt(token, AES_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) return null;
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('QR Decryption error:', error.message);
    return null;
  }
};

/**
 * Generate a dynamic QR token that refreshes periodically
 * The token encodes the ticketId along with a rotating timestamp window
 * @param {string} ticketId
 * @param {string} userId
 * @param {string} eventId
 * @returns {string} - Encrypted QR token
 */
const generateDynamicQRToken = (ticketId, userId, eventId) => {
  return encryptQRToken({
    ticketId,
    userId,
    eventId,
    type: 'GATE_ACCESS',
  });
};

module.exports = { encryptQRToken, decryptQRToken, generateDynamicQRToken };
