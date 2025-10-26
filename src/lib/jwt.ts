// src/lib/jwt.ts
import jwt, { Secret, SignOptions, JwtPayload } from 'jsonwebtoken';

const SECRET: Secret = process.env.JWT_SECRET || 'secret-key';

export function signJWT(
  payload: string | object | Buffer,
  options?: SignOptions
): string {
  const signOptions: SignOptions = {
    ...(options || {}),
    expiresIn: options?.expiresIn ?? '7d',
  };

  return jwt.sign(payload, SECRET, signOptions);
}

export function verifyJWT(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch (err) {
    console.error('JWT verification error:', err);
    return null;
  }
}