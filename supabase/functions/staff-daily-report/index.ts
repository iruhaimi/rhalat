import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

import { getCorsHeaders } from "../_shared/cors.ts";
Deno.serve(async (req) => {
  
  const corsHeaders = getCorsHeaders(req);
if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;

    // SECURITY: only allow callers that present either
    //   (a) a verified service-role JWT (validated by supabase-js, NOT a manual
    //       base64 decode of an unsigned payload), or
    //   (b) a pre-shared internal secret header (used by pg_cron via http_post).
    const authHeader = req.headers.get('Authorization') || '';
    const internalSecret = req.headers.get('x-internal-secret') || '';
    const expectedSecret = Deno.env.get('CRON_INTERNAL_SECRET') || '';

    let authorized = false;
    if (expectedSecret && internalSecret && internalSecret === expectedSecret) {
      authorized = true;
    } else if (authHeader.toLowerCase().startsWith('bearer ')) {
      // Verify the JWT signature via supabase-js (getClaims actually validates).
      try {
        const verifier = createClient(SUPABASE_URL, ANON, {
          global: { headers: { Authorization: authHeader } },
        });
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const { data, error } = await (verifier.auth as any).getClaims(token);
        if (!error && data?.claims?.role === 'service_role') {
          authorized = true;
        }
      } catch (_e) {
        authorized = false;
      }
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE);

    const since = new Date(Date.now() - 12 * 60 * 60 * 1000); // last 12h

    // HTML-escape helper — login attempts contain attacker-controlled fields
    // (email, IP, failure_reason) that get embedded into the HTML report.
    const esc = (s: unknown) =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // Login attempts
    const { data: attempts } = await admin
      .from('staff_login_attempts')
      .select('email, ip_address, user_agent, success, failure_reason, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    const successes = (attempts || []).filter((a: any) => a.success);
    const failures = (attempts || []).filter((a: any) => !a.success);

    // Group failures by email
    const failureByEmail = new Map<string, number>();
    failures.forEach((f: any) => failureByEmail.set(f.email, (failureByEmail.get(f.email) || 0) + 1));
    const topFailures = [...failureByEmail.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Audit highlights (security category)
    const { data: securityEvents } = await admin
      .from('staff_audit_log')
      .select('actor_email, event_type, description, created_at')
      .gte('created_at', since.toISOString())
      .eq('event_category', 'security')
      .order('created_at', { ascending: false })
      .limit(20);

    // Find super admins (recipients)
    const { data: superAdmins } = await admin
      .from('staff_permissions')
      .select('user_id')
      .eq('permission', 'manage_staff');

    const recipientEmails: string[] = [];
    for (const r of superAdmins || []) {
      const { data: u } = await admin.auth.admin.getUserById(r.user_id);
      if (u?.user?.email) recipientEmails.push(u.user.email);
    }

    const fmtRow = (a: any) => `
      <tr>
        <td style="padding:6px;border:1px solid #e5e7eb;">${esc(new Date(a.created_at).toLocaleString('ar-SA'))}</td>
        <td style="padding:6px;border:1px solid #e5e7eb;">${esc(a.email)}</td>
        <td style="padding:6px;border:1px solid #e5e7eb;">${esc(a.ip_address || '—')}</td>
        <td style="padding:6px;border:1px solid #e5e7eb;">${a.success ? '✅' : '❌'}</td>
        <td style="padding:6px;border:1px solid #e5e7eb;">${esc(a.failure_reason || '')}</td>
      </tr>`;

    const html = `
      <div style="font-family: Tahoma, Arial, sans-serif; direction:rtl; max-width:800px; margin:auto; padding:24px;">
        <h2 style="color:#1e40af;">تقرير نشاط دخول الموظفين (آخر 12 ساعة)</h2>
        <p>الفترة: ${since.toLocaleString('ar-SA')} — ${new Date().toLocaleString('ar-SA')}</p>
        <div style="display:flex; gap:12px; margin:16px 0;">
          <div style="flex:1; padding:12px; background:#dcfce7; border-radius:8px;">
            <div style="font-size:12px;">عمليات دخول ناجحة</div>
            <div style="font-size:24px; font-weight:bold;">${successes.length}</div>
          </div>
          <div style="flex:1; padding:12px; background:#fee2e2; border-radius:8px;">
            <div style="font-size:12px;">محاولات فاشلة</div>
            <div style="font-size:24px; font-weight:bold;">${failures.length}</div>
          </div>
          <div style="flex:1; padding:12px; background:#fef3c7; border-radius:8px;">
            <div style="font-size:12px;">أحداث أمنية</div>
            <div style="font-size:24px; font-weight:bold;">${securityEvents?.length || 0}</div>
          </div>
        </div>

        ${topFailures.length ? `
          <h3>أعلى الحسابات بمحاولات فاشلة</h3>
          <ul>${topFailures.map(([e, c]) => `<li>${esc(e)}: <strong>${esc(c)}</strong> محاولة</li>`).join('')}</ul>
        ` : ''}

        <h3>تفاصيل المحاولات</h3>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:6px;border:1px solid #e5e7eb;">الوقت</th>
              <th style="padding:6px;border:1px solid #e5e7eb;">البريد</th>
              <th style="padding:6px;border:1px solid #e5e7eb;">IP</th>
              <th style="padding:6px;border:1px solid #e5e7eb;">الحالة</th>
              <th style="padding:6px;border:1px solid #e5e7eb;">السبب</th>
            </tr>
          </thead>
          <tbody>${(attempts || []).slice(0, 50).map(fmtRow).join('')}</tbody>
        </table>

        ${securityEvents?.length ? `
          <h3 style="margin-top:24px;">أحداث أمنية</h3>
          <ul>${securityEvents.map((e: any) =>
            `<li><strong>${esc(e.event_type)}</strong> — ${esc(e.description)} <em>(${esc(e.actor_email || '—')})</em></li>`
          ).join('')}</ul>
        ` : ''}

        <hr style="margin:24px 0;"/>
        <p style="font-size:11px; color:#64748b;">تقرير تلقائي من نظام عطلات رحلاتكم. كل 12 ساعة.</p>
      </div>`;

    const text = `تقرير دخول الموظفين: نجاح ${successes.length} | فشل ${failures.length} | أحداث أمنية ${securityEvents?.length || 0}`;

    let sent = 0;
    for (const email of recipientEmails) {
      try {
        await admin.rpc('enqueue_email', {
          queue_name: 'transactional_emails',
          payload: {
            to: email,
            subject: `📊 تقرير دخول الموظفين - ${new Date().toLocaleDateString('ar-SA')}`,
            html,
            text,
            template_name: 'staff_daily_report',
            idempotency_key: `daily-report-${new Date().toISOString().slice(0, 13)}-${email}`,
          },
        });
        sent++;
      } catch (e) {
        console.error('enqueue failed', email, e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      successes: successes.length,
      failures: failures.length,
      security_events: securityEvents?.length || 0,
      recipients: recipientEmails.length,
      sent,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('staff-daily-report error', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
