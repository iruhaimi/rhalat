import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";

interface Send2FARequest {
  email: string;
  code?: string; // Ignored - always generated server-side
  userId: string; // Required - the user ID for the 2FA code
  accessToken?: string; // Optional fallback when platform headers are overwritten
}

// Generate a 6-digit code using a CSPRNG
function generateCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId, accessToken: bodyAccessToken }: Send2FARequest = await req.json();

    // Validate required fields
    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email and userId" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // SECURITY: Always generate the code server-side. Ignore any client-supplied code.
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Hash the code before storing (SHA-256) - matches verify_staff_2fa RPC
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const codeHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    console.log(`Processing 2FA for: ${email}`);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============================================================
    // AUTH CHECK: prefer a valid caller token, but keep a secure fallback for
    // already-published clients that may not forward the freshly-created token.
    // The fallback still validates that the target user exists, the email
    // matches the auth account, and the account has a staff role.
    // ============================================================
    const authHeader = req.headers.get("Authorization");
    const accessToken = bodyAccessToken || authHeader?.replace(/^Bearer\s+/i, "").trim();
    let verifiedBySession = false;
    if (accessToken && accessToken !== supabaseAnonKey) {
      const { data: { user: callingUser }, error: userErr } = await supabase.auth.getUser(accessToken);
      if (!userErr && callingUser?.id === userId) {
        verifiedBySession = true;
      }
    }

    const { data: targetUser, error: targetUserError } = await supabase.auth.admin.getUserById(userId);
    const normalizedEmail = email.trim().toLowerCase();
    const targetEmail = targetUser?.user?.email?.trim().toLowerCase();
    if (targetUserError || !targetUser?.user || targetEmail !== normalizedEmail) {
      console.error("2FA auth validation failed", { userId, targetUserError: targetUserError?.message });
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: staffRoles, error: staffRoleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "agent", "tour_operator"]);

    if (staffRoleError || !staffRoles || staffRoles.length === 0) {
      console.error("2FA staff role validation failed", { userId, staffRoleError: staffRoleError?.message });
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!verifiedBySession) {
      // SECURITY: require a valid caller session that matches the target userId.
      // The prior fallback (account existence + role check) allowed anyone who
      // knew a staff email/userId to trigger a 2FA send, so it is removed.
      console.error("2FA rejected: caller session did not match target user", { userId });
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // SECURITY: destination phone must come from the server-side user record,
    // never from the request body, so an attacker cannot redirect the OTP.
    let phone: string | undefined =
      (targetUser?.user?.phone && String(targetUser.user.phone).trim()) || undefined;
    if (!phone) {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("phone")
        .eq("user_id", userId)
        .maybeSingle();
      if (profileRow?.phone) phone = String(profileRow.phone).trim();
    }

    // Rate limit (max 5 codes per user per 5 minutes)
    const { data: rateOk } = await supabase.rpc("check_2fa_rate_limit", {
      check_user_id: userId,
    });
    if (rateOk === false) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait before requesting another code." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ============================================================
    // INSERT 2FA CODE INTO DATABASE (using service_role)
    // ============================================================
    const { error: insertError } = await supabase.from("staff_2fa_codes").insert({
      user_id: userId,
      email: targetEmail,
      code: codeHash, // Store hashed code, not plaintext
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("Failed to insert 2FA code:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create verification code", details: insertError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`2FA code created for user: ${userId}`);

    // ============================================================
    // EMAIL SENDING (via backend built-in email queue)
    // ============================================================
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    let emailSent = false;
    let smsSent = false;
    const results: { email?: boolean; sms?: boolean; errors?: string[] } = {
      errors: [],
    };

    try {
      // Use service_role for server-to-server invocation. The send-transactional-email
      // function's JWT gate allows service_role to send any template to any recipient.
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateName: "staff-2fa",
          recipientEmail: targetEmail,
          idempotencyKey: `staff-2fa-${userId}-${Date.now()}`,
          templateData: { code },
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error("email invoke error:", emailResponse.status, errorText);
        results.errors?.push(`Email error: ${emailResponse.status} ${errorText}`);
      } else {
        const invokeData = await emailResponse.json().catch(() => null);
        emailSent = true;
        results.email = true;
        console.log("2FA email enqueued successfully", invokeData);
      }
    } catch (emailError: unknown) {
      console.error("Email sending failed:", emailError);
      const errorMessage = emailError instanceof Error ? emailError.message : "Unknown error";
      results.errors?.push(`Email error: ${errorMessage}`);
    }

    // ============================================================
    // SMS SENDING (using Twilio when configured)
    // ============================================================
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER && phone) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        
        const smsResponse = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          },
          body: new URLSearchParams({
            To: phone,
            From: TWILIO_PHONE_NUMBER,
            Body: `رمز التحقق للدخول إلى بوابة الموظفين: ${code}\n\nصالح لمدة 30 دقيقة.\n\nعطلات رحلاتكم`,
          }),
        });

        if (smsResponse.ok) {
          smsSent = true;
          results.sms = true;
          console.log("2FA SMS sent successfully");
        } else {
          const errorData = await smsResponse.json();
          console.error("Twilio SMS error:", errorData);
          results.errors?.push(`SMS error: ${JSON.stringify(errorData)}`);
        }
      } catch (smsError: unknown) {
        console.error("SMS sending failed:", smsError);
        const errorMessage = smsError instanceof Error ? smsError.message : "Unknown error";
        results.errors?.push(`SMS error: ${errorMessage}`);
      }
    } else if (phone) {
      console.log("Twilio credentials not configured - skipping SMS");
      results.errors?.push("SMS provider not configured");
    }

    // ============================================================
    // NOTIFICATION: Notify admins about 2FA attempt
    // ============================================================
    try {
      // Get admin users to notify
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminRoles && adminRoles.length > 0) {
        for (const admin of adminRoles) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", admin.user_id)
            .single();

          if (profile) {
            await supabase.from("notifications").insert({
              user_id: profile.id,
              title: "🔐 محاولة دخول جديدة",
              message: `تم إرسال رمز تحقق للموظف: ${targetEmail}`,
              type: "security",
              action_url: "/admin/users",
            });
          }
        }
      }
    } catch (notifyError) {
      console.error("Failed to notify admins:", notifyError);
    }

    if (!emailSent && !smsSent) {
      // Code was still created in DB; do NOT return it to the client.
      return new Response(
        JSON.stringify({
          success: true,
          emailSent: false,
          smsSent: false,
          error: "Failed to send 2FA code via any channel",
          details: results.errors,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        smsSent,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-staff-2fa function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);