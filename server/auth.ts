/**
 * 店员后台鉴权（HMAC Token，24 小时有效）
 */

import './loadEnv.js';
import crypto from 'crypto';

function getSecret(): string {
  return process.env.ADMIN_SECRET || 'change-this-in-env-local';
}

function getStaffUser(): string {
  return process.env.STAFF_USERNAME || 'admin';
}

function getStaffPass(): string {
  return process.env.STAFF_PASSWORD || 'fht1987';
}

function safeStringEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function verifyStaffCredentials(username: string, password: string): boolean {
  return (
    safeStringEqual(username || '', getStaffUser()) &&
    safeStringEqual(password || '', getStaffPass())
  );
}

function base64url(data: string): string {
  return Buffer.from(data).toString('base64url');
}

function fromBase64url(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf8');
}

export function createStaffToken(): string {
  const exp = Date.now() + 24 * 60 * 60 * 1000;
  const payload = base64url(JSON.stringify({ role: 'staff', exp }));
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyStaffToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  } catch {
    return false;
  }
  try {
    const { exp } = JSON.parse(fromBase64url(payload)) as { exp?: number };
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

export function extractBearerToken(authHeader: string | undefined): string | undefined {
  if (!authHeader?.startsWith('Bearer ')) return undefined;
  return authHeader.slice(7).trim();
}
