import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import { db } from '../lib/db.js';
import { lucia } from '../lib/lucia.js';
import { sendMail } from '../lib/mailer.js';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (req, reply) => {
    const body = z.object({
      email: z.string().email(),
      password: z.string().min(8).max(128),
      fullName: z.string().min(2).max(120),
    }).parse(req.body);

    const existing = await db.user.findUnique({ where: { email: body.email } });
    if (existing) return reply.code(409).send({ error: 'email_in_use' });

    const passwordHash = await hash(body.password);
    const user = await db.user.create({
      data: {
        email: body.email,
        passwordHash,
        profile: { create: { fullName: body.fullName } },
        roles: { create: { role: 'customer' } },
      },
    });

    const session = await lucia.createSession(user.id, {});
    reply.header('set-cookie', lucia.createSessionCookie(session.id).serialize());
    return { user: { id: user.id, email: user.email } };
  });

  app.post('/login', async (req, reply) => {
    const body = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }).parse(req.body);

    const user = await db.user.findUnique({ where: { email: body.email } });
    const ip = (req.ip ?? null) as any;
    const ua = req.headers['user-agent'] ?? null;

    if (!user) {
      await db.$executeRawUnsafe(
        `INSERT INTO staff_login_attempts (email, ip_address, user_agent, success, failure_reason)
         VALUES ($1, $2::inet, $3, false, 'no_user')`,
        body.email, ip, ua
      );
      return reply.code(401).send({ error: 'invalid_credentials' });
    }

    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      return reply.code(423).send({ error: 'account_locked' });
    }

    const ok = await verify(user.passwordHash, body.password);
    if (!ok) {
      await db.$executeRawUnsafe(
        `INSERT INTO staff_login_attempts (email, ip_address, user_agent, success, failure_reason)
         VALUES ($1, $2::inet, $3, false, 'bad_password')`,
        body.email, ip, ua
      );
      return reply.code(401).send({ error: 'invalid_credentials' });
    }

    const roles = await db.userRole.findMany({ where: { userId: user.id } });
    const isStaff = roles.some(r => ['admin', 'super_admin', 'agent', 'tour_operator'].includes(r.role));

    if (isStaff) {
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      await db.$executeRawUnsafe(
        `INSERT INTO staff_2fa_codes (user_id, code_hash, expires_at)
         VALUES ($1::uuid, $2, NOW() + INTERVAL '10 minutes')`,
        user.id, sha256(code)
      );
      await sendMail(
        user.email,
        'رمز التحقق - عطلات رحلاتكم',
        `<p>رمز التحقق: <b>${code}</b></p><p>صالح لمدة 10 دقائق.</p>`
      );
      return { requires2fa: true, userId: user.id };
    }

    const session = await lucia.createSession(user.id, {});
    reply.header('set-cookie', lucia.createSessionCookie(session.id).serialize());
    await db.$executeRawUnsafe(
      `INSERT INTO staff_login_attempts (email, ip_address, user_agent, success)
       VALUES ($1, $2::inet, $3, true)`,
      body.email, ip, ua
    );
    return { user: { id: user.id, email: user.email }, roles: roles.map(r => r.role) };
  });

  app.post('/2fa/verify', async (req, reply) => {
    const body = z.object({
      userId: z.string().uuid(),
      code: z.string().regex(/^\d{6}$/),
    }).parse(req.body);

    const rows = await db.$queryRawUnsafe<Array<{ id: string; expires_at: Date; used: boolean }>>(
      `SELECT id, expires_at, used FROM staff_2fa_codes
       WHERE user_id = $1::uuid AND code_hash = $2 AND used = false
       ORDER BY created_at DESC LIMIT 1`,
      body.userId, sha256(body.code)
    );
    const row = rows[0];
    if (!row || row.expires_at < new Date()) {
      return reply.code(401).send({ error: 'invalid_or_expired' });
    }

    await db.$executeRawUnsafe(`UPDATE staff_2fa_codes SET used = true WHERE id = $1::uuid`, row.id);
    const session = await lucia.createSession(body.userId, {});
    reply.header('set-cookie', lucia.createSessionCookie(session.id).serialize());
    return { ok: true };
  });

  app.post('/recovery-codes/generate', async (req: FastifyRequest, reply) => {
    const sessionId = lucia.readSessionCookie(req.headers.cookie ?? '');
    if (!sessionId) return reply.code(401).send({ error: 'unauthorized' });
    const { user } = await lucia.validateSession(sessionId);
    if (!user) return reply.code(401).send({ error: 'unauthorized' });

    const codes = Array.from({ length: 10 }, () => randomBytes(5).toString('hex'));
    await db.$executeRawUnsafe(`DELETE FROM recovery_codes WHERE user_id = $1::uuid`, user.id);
    for (const c of codes) {
      await db.$executeRawUnsafe(
        `INSERT INTO recovery_codes (user_id, code_hash) VALUES ($1::uuid, $2)`,
        user.id, sha256(c)
      );
    }
    return { codes };
  });

  app.post('/logout', async (req, reply) => {
    const sessionId = lucia.readSessionCookie(req.headers.cookie ?? '');
    if (sessionId) await lucia.invalidateSession(sessionId);
    reply.header('set-cookie', lucia.createBlankSessionCookie().serialize());
    return { ok: true };
  });

  app.get('/me', async (req, reply) => {
    const sessionId = lucia.readSessionCookie(req.headers.cookie ?? '');
    if (!sessionId) return reply.code(401).send({ error: 'unauthorized' });
    const { user } = await lucia.validateSession(sessionId);
    if (!user) return reply.code(401).send({ error: 'unauthorized' });
    const roles = await db.userRole.findMany({ where: { userId: user.id } });
    return { user, roles: roles.map(r => r.role) };
  });
}