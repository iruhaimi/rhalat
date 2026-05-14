import type { FastifyReply, FastifyRequest } from 'fastify';
import { lucia } from '../lib/lucia.js';
import { db } from '../lib/db.js';
import type { AppRole } from '@prisma/client';

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? '');
  if (!sessionId) { reply.code(401).send({ error: 'unauthorized' }); return null; }
  const { user } = await lucia.validateSession(sessionId);
  if (!user) { reply.code(401).send({ error: 'unauthorized' }); return null; }
  const roles = (await db.userRole.findMany({ where: { userId: user.id } })).map(r => r.role);
  return { user, roles };
}

export function requireRole(...allowed: AppRole[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = await requireAuth(req, reply);
    if (!ctx) return;
    if (!ctx.roles.some(r => allowed.includes(r))) {
      reply.code(403).send({ error: 'forbidden' });
      return;
    }
    (req as any).ctx = ctx;
  };
}