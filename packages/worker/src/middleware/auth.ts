import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import type { JWTPayload } from 'hono/utils/jwt/types';
import type { UserRole } from '../db/schema';

// ── Types ──────────────────────────────────────────────

export interface AuthUser {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
}

// Register jwtPayload in Hono's context
declare module 'hono' {
  interface ContextVariableMap {
    jwtPayload: JWTPayload & AuthUser;
    authUser: AuthUser;
  }
}

// ── Middleware: verify JWT ─────────────────────────────

/**
 * Reads Bearer token from Authorization header, verifies it using
 * c.env.JWT_SECRET, and sets c.var.jwtPayload.
 */
export function authRequired() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid Authorization header' }, 401);
    }
    const token = authHeader.slice(7);
    try {
      const payload = await verify(token, c.env.JWT_SECRET as string, 'HS256');
      c.set('jwtPayload', payload as JWTPayload & AuthUser);
      await next();
    } catch {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
  };
}

// ── Middleware: role gate ──────────────────────────────

/**
 * Restrict route to specific roles. Must be placed AFTER authRequired().
 */
export function requireRole(...roles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const payload = c.get('jwtPayload');
    if (!payload) {
      return c.json({ error: 'Unauthorized — no token payload' }, 401);
    }
    if (!roles.includes(payload.role)) {
      return c.json({ error: 'Forbidden — insufficient role' }, 403);
    }
    // Attach typed user to context
    c.set('authUser', {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    });
    await next();
  };
}

// ── Helpers ────────────────────────────────────────────

/** Extract the authenticated user from context */
export function getAuthUser(c: Context): AuthUser {
  return c.get('authUser');
}

/** Generate a random ID (for record creation) */
export function genId(): string {
  return crypto.randomUUID();
}
