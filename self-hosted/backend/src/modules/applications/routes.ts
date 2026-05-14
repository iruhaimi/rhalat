import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../../lib/db.js';
import { requireAuth } from '../../middleware/rbac.js';

export async function applicationsRoutes(app: FastifyInstance) {
  app.get('/mine', async (req, reply) => {
    const ctx = await requireAuth(req, reply); if (!ctx) return;
    const rows = await db.$queryRawUnsafe(
      `SELECT id, reference_number, status, created_at FROM applications
       WHERE user_id = $1::uuid ORDER BY created_at DESC`, ctx.user.id
    );
    return { applications: rows };
  });

  app.post('/draft', async (req, reply) => {
    const ctx = await requireAuth(req, reply); if (!ctx) return;
    const body = z.object({ visaTypeId: z.string().uuid() }).parse(req.body);
    const rows = await db.$queryRawUnsafe<Array<{ id: string; reference_number: string }>>(
      `INSERT INTO applications (user_id, visa_type_id, status)
       VALUES ($1::uuid, $2::uuid, 'draft')
       RETURNING id, reference_number`,
      ctx.user.id, body.visaTypeId
    );
    return rows[0];
  });
}