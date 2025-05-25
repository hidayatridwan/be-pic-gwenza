import { createHash } from "node:crypto";

export const hashToken = (token) => {
  return createHash("sha256").update(token).digest("hex");
};

/**
 * Sanitizes a string by trimming whitespace and converting to lowercase.
 * @param {string} value - The input string.
 * @returns {string} - The sanitized string.
 */
export function sanitizeString(value) {
  if (typeof value !== "string") return value; // Optional: handle non-string values
  return value.trim().toLowerCase();
}
