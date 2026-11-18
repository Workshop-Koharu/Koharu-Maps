/**
 * Koharu Maps - Authentication Utilities with Async DB Support
 */

import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { NextRequest } from 'next/server';
import { db, User, ApiKey } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'koharu_maps_super_secret_production_key_2026'
);

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export async function createToken(payload: { userId: string; email: string; name: string }): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string; name: string } | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(req: NextRequest): Promise<User | null> {
  const authHeader = req.headers.get('authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    const cookieToken = req.cookies.get('kmap_token')?.value;
    if (cookieToken) token = cookieToken;
  }

  if (!token) return null;
  const decoded = await verifyToken(token);
  if (!decoded) return null;

  const user = await db.getUserById(decoded.userId);
  return user || null;
}

export async function verifyApiKey(req: NextRequest): Promise<ApiKey | null> {
  const keyToken = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('api_key');
  if (!keyToken) return null;

  const apiKey = await db.getApiKey(keyToken);
  if (apiKey) {
    await db.incrementKeyUsage(apiKey.id);
    return apiKey;
  }
  return null;
}

export function getClientConnectionInfo(req: NextRequest): { ip: string; location: string; userAgent: string } {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : (req.headers.get('x-real-ip') || '127.0.0.1');

  const country = req.headers.get('x-vercel-ip-country') || '';
  const city = req.headers.get('x-vercel-ip-city') ? decodeURIComponent(req.headers.get('x-vercel-ip-city') || '') : '';
  const location = city && country ? `${city}, ${country}` : (country || '대한민국');

  const userAgent = req.headers.get('user-agent') || '기타 브라우저';

  return { ip, location, userAgent };
}
