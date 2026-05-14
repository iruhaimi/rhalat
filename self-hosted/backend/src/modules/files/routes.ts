import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { BUCKETS, presignedDownload, presignedUpload } from '../../lib/minio.js';
import { requireAuth } from '../../middleware/rbac.js';
import { db } from '../../lib/db.js';

export async function filesRoutes(app: FastifyInstance) {
  app.post('/presigned-upload', async (req, reply) => {
    const ctx = await requireAuth(req, reply); if (!ctx) return;
    const body = z.object({
      applicationId: z.string().uuid(),
      documentType: z.string().min(1),
      fileName: z.string().min(1),
      mimeType: z.string().min(1),
      fileSize: z.number().int().positive().max(20 * 1024 * 1024),
    }).parse(req.body);

    const rows = await db.$queryRawUnsafe<Array<{ user_id: string }>>(
      `SELECT user_id FROM applications WHERE id = $1::uuid`, body.applicationId
    );
    if (!rows[0] || (rows[0].user_id !== ctx.user.id &&
        !ctx.roles.some(r => ['admin','super_admin','agent'].includes(r)))) {
      return reply.code(403).send({ error: 'forbidden' });
    }

    const objectKey = `${rows[0].user_id}/${body.applicationId}/${randomUUID()}-${body.fileName}`;
    const url = await presignedUpload(BUCKETS.documents, objectKey, 600);

    await db.$executeRawUnsafe(
      `INSERT INTO application_documents
        (application_id, document_type, bucket, object_key, file_name, file_size, mime_type)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)`,
      body.applicationId, body.documentType, BUCKETS.documents,
      objectKey, body.fileName, body.fileSize, body.mimeType
    );
    return { uploadUrl: url, objectKey };
  });

  app.get('/presigned-download/:id', async (req, reply) => {
    const ctx = await requireAuth(req, reply); if (!ctx) return;
    const { id } = req.params as { id: string };
    const rows = await db.$queryRawUnsafe<Array<{ bucket: string; object_key: string; user_id: string; assigned_agent_id: string | null }>>(
      `SELECT d.bucket, d.object_key, a.user_id, a.assigned_agent_id
       FROM application_documents d
       JOIN applications a ON a.id = d.application_id
       WHERE d.id = $1::uuid`, id
    );
    const doc = rows[0];
    if (!doc) return reply.code(404).send({ error: 'not_found' });

    const isOwner = doc.user_id === ctx.user.id;
    const isAssignedAgent = doc.assigned_agent_id === ctx.user.id;
    const isAdmin = ctx.roles.some(r => ['admin','super_admin'].includes(r));
    if (!isOwner && !isAssignedAgent && !isAdmin) return reply.code(403).send({ error: 'forbidden' });

    await db.$executeRawUnsafe(
      `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1::uuid, 'document.download', 'application_document', $2::uuid, '{}')`,
      ctx.user.id, id
    );

    const url = await presignedDownload(doc.bucket, doc.object_key, 300);
    return { downloadUrl: url };
  });
}