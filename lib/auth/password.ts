import { compare, hash } from 'bcryptjs';
export const hashPassword = (password: string) => hash(password, 12);
export const verifyPassword = (password: string, encoded: string) => compare(password, encoded);
export function validPassword(password: string) {
  return password.length >= 12 && Buffer.byteLength(password) <= 72 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[\W_]/.test(password);
}
