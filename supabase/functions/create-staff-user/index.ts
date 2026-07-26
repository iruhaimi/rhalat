import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { Resend } from 'https://esm.sh/resend@4.0.0'
import { getCorsHeaders } from '../_shared/cors.ts'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header to verify admin status
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's token to check admin status
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get the calling user
    const { data: { user: callingUser }, error: userError } = await userClient.auth.getUser()
    if (userError || !callingUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if calling user is admin using service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    
    // SECURITY: require manage_staff (super admin) to create staff accounts.
    // Regular admins cannot create additional admin/agent accounts — this prevents
    // a single compromised admin from establishing persistence by minting new staff.
    const { data: canManageStaff } = await adminClient.rpc('has_permission', {
      _user_id: callingUser.id,
      _permission: 'manage_staff',
    })

    if (!canManageStaff) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only super admins can create staff users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { email, password, full_name, phone, role, sendEmail = true, grantSuperAdmin = false } = await req.json()

    // Validate required fields
    if (!email || !password || !role) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email, password, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate role
    if (!['admin', 'agent', 'tour_operator'].includes(role)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid role. Must be admin, agent or tour_operator' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the user using admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for staff
      user_metadata: { full_name }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(
        JSON.stringify({ success: false, error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update profile with phone if provided
    if (phone && newUser.user) {
      await adminClient
        .from('profiles')
        .update({ phone })
        .eq('user_id', newUser.user.id)
    }

    // Remove the 'customer' role that was automatically added by the trigger
    // Staff members (admin/agent) should NOT have the customer role
    await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', newUser.user!.id)
      .eq('role', 'customer')

    // Add the staff role
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: newUser.user!.id,
        role: role
      })

    if (roleError) {
      console.error('Error adding role:', roleError)
    }

    // Grant super admin permission if requested and role is admin
    if (grantSuperAdmin && role === 'admin') {
      // SECURITY: Only existing super admins (manage_staff permission) may grant super admin.
      const { data: canGrant, error: permCheckError } = await adminClient.rpc('has_permission', {
        _user_id: callingUser.id,
        _permission: 'manage_staff',
      })

      if (permCheckError || !canGrant) {
        // Roll back the created user to avoid orphaned accounts on privilege-escalation attempts.
        try {
          await adminClient.auth.admin.deleteUser(newUser.user!.id)
        } catch (rollbackErr) {
          console.error('Rollback after privilege escalation attempt failed:', rollbackErr)
        }
        return new Response(
          JSON.stringify({ success: false, error: 'Only super admins can grant super admin rights' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: permError } = await adminClient
        .from('staff_permissions')
        .insert({
          user_id: newUser.user!.id,
          permission: 'manage_staff',
          granted_by: callingUser.id
        })

      if (permError) {
        console.error('Error granting super admin:', permError)
      } else {
        console.log('Super admin permission granted to:', email)
      }
    }

    // Log the activity
    await adminClient
      .from('role_activity_log')
      .insert({
        target_user_id: newUser.user!.id,
        performed_by: callingUser.id,
        action: 'create_staff',
        role: role
      })

    // Send welcome email with a one-time password setup link (no plaintext password)
    let emailSent = false
    if (sendEmail && resend) {
      try {
        const roleLabel = role === 'admin' ? 'مشرف' : role === 'agent' ? 'وكيل تأشيرات' : 'وكيل سياحي'

        // Generate a secure password recovery link so the staff member sets their own password
        let setupLink = ''
        try {
          const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: 'recovery',
            email,
          })
          if (linkError) {
            console.error('Error generating recovery link:', linkError)
          } else {
            setupLink = linkData?.properties?.action_link || ''
          }
        } catch (linkErr) {
          console.error('Failed to generate recovery link:', linkErr)
        }

        const { error: emailError } = await resend.emails.send({
          from: 'رحلات للتأشيرات <onboarding@resend.dev>',
          to: [email],
          subject: 'تم إنشاء حسابك في نظام رحلات للتأشيرات',
          html: `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">مرحباً بك في فريق العمل</h1>
                  <p style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 14px;">نظام رحلات للتأشيرات</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                    عزيزي/عزيزتي <strong>${full_name || 'الموظف الجديد'}</strong>،
                  </p>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
                    تم إنشاء حسابك بنجاح كـ <strong style="color: #0ea5e9;">${roleLabel}</strong> في نظام رحلات للتأشيرات. لأمانك، يرجى تعيين كلمة المرور الخاصة بك من خلال الرابط أدناه:
                  </p>

                  <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">البريد الإلكتروني:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: bold;" dir="ltr">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">الصلاحية:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: bold;">${roleLabel}</td>
                      </tr>
                    </table>
                  </div>

                  ${setupLink ? `
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${setupLink}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                      تعيين كلمة المرور
                    </a>
                  </div>
                  ` : ''}

                  <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                      ⚠️ <strong>هام:</strong> هذا الرابط صالح لفترة محدودة. اختر كلمة مرور قوية ولا تشاركها مع أي شخص. إذا لم تطلب هذا الحساب، يرجى تجاهل هذه الرسالة.
                    </p>
                  </div>
                  
                  <p style="color: #374151; font-size: 14px; line-height: 1.8; margin-top: 25px;">
                    مع أطيب التحيات،<br/>
                    <strong>فريق رحلات للتأشيرات</strong>
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    هذا البريد تم إرساله تلقائياً - يرجى عدم الرد عليه
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        })

        if (emailError) {
          console.error('Error sending welcome email:', emailError)
        } else {
          emailSent = true
          console.log(`Welcome email sent to ${email}`)
        }
      } catch (emailErr) {
        console.error('Failed to send welcome email:', emailErr)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Staff user created successfully',
        emailSent,
        user: {
          id: newUser.user!.id,
          email: newUser.user!.email
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
