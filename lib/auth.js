import { SignJWT, jwtVerify } from 'jose'

export const COOKIE_NAME = 'ff_token'
export const JWT_SECRET = process.env.JWT_SECRET || 'FocusTube-dev-secret-change-in-production'

const secret = () => new TextEncoder().encode(JWT_SECRET)

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret())
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload
  } catch {
    return null
  }
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
}

// Only import bcryptjs in Node.js runtime (API routes), not edge middleware
export async function hashPassword(password) {
  const bcrypt = await import('bcryptjs')
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password, hash) {
  const bcrypt = await import('bcryptjs')
  return bcrypt.compare(password, hash)
}
