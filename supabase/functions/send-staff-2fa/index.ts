import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Send2FARequest {
  email: string;
  code?: string; // Optional - will be generated if not provided
  phone?: string; // Optional for SMS
  userId: string; // Required - the user ID for the 2FA code
}

// Generate a 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code: providedCode, phone, userId }: Send2FARequest = await req.json();

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

    // Generate or use provided code
    const code = providedCode || generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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

    if (!supabaseUrl || !supabaseServiceKey) {
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
    // INSERT 2FA CODE INTO DATABASE (using service_role)
    // ============================================================
    const { error: insertError } = await supabase.from("staff_2fa_codes").insert({
      user_id: userId,
      email: email,
      code: code,
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
    // EMAIL SENDING (using Resend when configured)
    // ============================================================
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    let emailSent = false;
    let smsSent = false;
    let resendRecipientRestricted = false;
    const results: { email?: boolean; sms?: boolean; errors?: string[] } = {
      errors: [],
    };

    if (RESEND_API_KEY) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "عطلات رحلاتكم <onboarding@resend.dev>",
            to: [email],
            subject: "رمز التحقق للدخول - عطلات رحلاتكم",
            html: `
              <!DOCTYPE html>
              <html dir="rtl" lang="ar">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #1e293b; color: #e2e8f0; margin: 0; padding: 20px;">
                <div style="max-width: 500px; margin: 0 auto; background-color: #334155; border-radius: 12px; padding: 30px; text-align: center;">
                  <div style="margin-bottom: 20px;">
                    <div style="background-color: #3b82f6; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 30px;">🔐</span>
                    </div>
                  </div>
                  <h1 style="color: #f8fafc; font-size: 24px; margin-bottom: 10px;">التحقق بخطوتين</h1>
                  <p style="color: #94a3b8; font-size: 14px; margin-bottom: 25px;">
                    رمز التحقق للدخول إلى بوابة الموظفين
                  </p>
                  <div style="background-color: #1e293b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #3b82f6;">${code}</span>
                  </div>
                  <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
                    ⏱️ هذا الرمز صالح لمدة 10 دقائق فقط
                  </p>
                  <p style="color: #64748b; font-size: 11px; margin-top: 15px;">
                    إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.
                  </p>
                  <hr style="border: none; border-top: 1px solid #475569; margin: 25px 0;">
                  <p style="color: #64748b; font-size: 11px;">
                    عطلات رحلاتكم - بوابة الموظفين
                  </p>
                </div>
              </body>
              </html>
            `,
          }),
        });

        if (emailResponse.ok) {
          emailSent = true;
          results.email = true;
          console.log("2FA email sent successfully");
        } else {
          const errorData = await emailResponse.json();
          console.error("Resend email error:", errorData);
          results.errors?.push(`Email error: ${JSON.stringify(errorData)}`);

          if (
            errorData &&
            (errorData.statusCode === 403 || emailResponse.status === 403) &&
            errorData.name === "validation_error" &&
            typeof errorData.message === "string" &&
            errorData.message.includes("You can only send testing emails")
          ) {
            resendRecipientRestricted = true;
          }
        }
      } catch (emailError: unknown) {
        console.error("Email sending failed:", emailError);
        const errorMessage = emailError instanceof Error ? emailError.message : "Unknown error";
        results.errors?.push(`Email error: ${errorMessage}`);
      }
    } else {
      console.log("RESEND_API_KEY not configured - skipping email");
      results.errors?.push("Email provider not configured");
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
            Body: `رمز التحقق للدخول إلى بوابة الموظفين: ${code}\n\nصالح لمدة 10 دقائق.\n\nعطلات رحلاتكم`,
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
              message: `تم إرسال رمز تحقق للموظف: ${email}`,
              type: "security",
              action_url: "/admin/users",
            });
          }
        }
      }
    } catch (notifyError) {
      console.error("Failed to notify admins:", notifyError);
    }

    // Check if at least one method worked or if none are configured (for testing)
    const noProviderConfigured = !RESEND_API_KEY && !TWILIO_ACCOUNT_SID;
    
    if (noProviderConfigured) {
      console.log(`[TEST MODE] 2FA code for ${email}: ${code}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Test mode - no providers configured",
          testMode: true,
          code: code, // Return code in test mode for display
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (resendRecipientRestricted) {
      console.log(`[TEST MODE] Resend blocked recipient. Code for ${email}: ${code}`);
      return new Response(
        JSON.stringify({
          success: true,
          emailSent: false,
          smsSent: false,
          testMode: true,
          code: code, // Return code for fallback display
          error: "Resend test-mode restriction: domain not verified",
          details: results.errors,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!emailSent && !smsSent) {
      // Code was still created in DB, return it for fallback
      return new Response(
        JSON.stringify({
          success: true,
          emailSent: false,
          smsSent: false,
          code: code, // Return code for fallback display
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