import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

import { getCorsHeaders } from "../_shared/cors.ts";
import { sendComposedEmail } from '../_shared/send-composed-email.ts';
Deno.serve(async (req) => {
  
  const corsHeaders = getCorsHeaders(req);
if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders });

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders });

    const body = await req.json().catch(() => ({}));
    const newPath = String(body.new_path || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (newPath.length < 8 || newPath.length > 40) {
      return new Response(JSON.stringify({ error: 'invalid_path_length' }), { status: 400, headers: corsHeaders });
    }

    // Use the SECURITY DEFINER RPC for rotation + audit + force logout
    const { data, error } = await userClient.rpc('rotate_staff_portal_path', { p_new_path: newPath });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 403, headers: corsHeaders });
    }

    // Send notification email to all staff with new URL
    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: staffRoles } = await admin
      .from('user_roles')
      .select('user_id')
      .in('role', ['admin', 'agent']);

    const staffIds = (staffRoles || []).map((r: any) => r.user_id);
    const emails: string[] = [];
    for (const id of staffIds) {
      const { data: u } = await admin.auth.admin.getUserById(id);
      if (u?.user?.email) emails.push(u.user.email);
    }

    const origin = req.headers.get('origin') || 'https://visafaster.com';
    const newUrl = `${origin}/${data.new_path}`;
    const html = `
      <div style="font-family: Tahoma, Arial, sans-serif; direction: rtl; max-width:600px; margin:auto; padding:24px;">
        <h2 style="color:#1e40af;">تم تدوير رابط بوابة الموظفين</h2>
        <p>عزيزي الموظف،</p>
        <p>تم تحديث الرابط السري لدخول بوابة فريق العمل. الرابط الجديد:</p>
        <p style="background:#f1f5f9; padding:12px; border-radius:8px; font-family:monospace; word-break:break-all;">
          <a href="${newUrl}">${newUrl}</a>
        </p>
        <p><strong>ملاحظة:</strong> الرابط القديم لم يعد صالحاً، وتم تسجيل خروجك تلقائياً. الرجاء استخدام الرابط الجديد لإعادة الدخول.</p>
        <p>إذا لم تطلب هذا التغيير، تواصل مع الإدارة فوراً.</p>
        <hr/>
        <p style="font-size:12px; color:#64748b;">هذه رسالة تلقائية من نظام عطلات رحلاتكم.</p>
      </div>`;

    // Email failure must not roll back a completed portal rotation.
    for (const email of emails) {
      try {
        await sendComposedEmail({
            to: email,
            subject: '🔐 تحديث رابط بوابة الموظفين',
            html,
            text: `تم تدوير رابط بوابة الموظفين\nعزيزي الموظف، تم تحديث الرابط السري لدخول بوابة فريق العمل. الرابط الجديد: ${newUrl}\nالرابط القديم لم يعد صالحاً، وتم تسجيل خروجك تلقائياً. الرجاء استخدام الرابط الجديد لإعادة الدخول.\nإذا لم تطلب هذا التغيير، تواصل مع الإدارة فوراً.\nهذه رسالة تلقائية من نظام عطلات رحلاتكم.`,
            label: 'portal_rotation',
            idempotencyKey: `portal-rotate-${data.new_path}-${email}`,
        });
      } catch (e) {
        console.error('Portal notification failed', e instanceof Error ? e.message : 'Unknown error');
      }
    }

    return new Response(JSON.stringify({ success: true, new_path: data.new_path, notified: emails.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('rotate-portal-secret error', e);
    return new Response(JSON.stringify({ error: e.message || 'internal_error' }), { status: 500, headers: corsHeaders });
  }
});
