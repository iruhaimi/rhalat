import { db } from '../lib/db.js';
import { sendMail } from '../lib/mailer.js';

export async function processEmailQueue() {
  const rows = await db.$queryRawUnsafe<Array<{ id: string; to_email: string; subject: string; template_data: any }>>(
    `SELECT id, to_email, subject, template_data FROM email_queue
     WHERE status = 'pending' AND scheduled_at <= NOW() AND attempts < 5
     ORDER BY scheduled_at LIMIT 50 FOR UPDATE SKIP LOCKED`
  );
  for (const r of rows) {
    try {
      await sendMail(r.to_email, r.subject, String(r.template_data?.html ?? ''));
      await db.$executeRawUnsafe(
        `UPDATE email_queue SET status='sent', sent_at=NOW() WHERE id=$1::uuid`, r.id
      );
    } catch (e: any) {
      await db.$executeRawUnsafe(
        `UPDATE email_queue SET attempts = attempts + 1, last_error = $2 WHERE id = $1::uuid`,
        r.id, String(e?.message ?? e)
      );
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  processEmailQueue().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}