
import bcrypt from 'bcryptjs';

export function comparePasswords(plain: string, hashed: string) {
  return bcrypt.compare(plain, hashed);
}