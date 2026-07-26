import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { getCorsHeaders } from '../_shared/cors.ts'

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
    
    const { data: isAdminResult } = await adminClient.rpc('is_admin', { _user_id: callingUser.id })
    
    if (!isAdminResult) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only admins can delete staff users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY FIX: Check if calling user has manage_staff permission
    const { data: hasManageStaffPermission } = await adminClient.rpc('has_permission', { 
      _user_id: callingUser.id, 
      _permission: 'manage_staff' 
    })

    if (!hasManageStaffPermission) {
      console.log(`Security: User ${callingUser.id} attempted to delete staff without manage_staff permission`)
      return new Response(
        JSON.stringify({ success: false, error: 'ليس لديك صلاحية إدارة الموظفين' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { user_id } = await req.json()

    // Validate required fields
    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent self-deletion
    if (user_id === callingUser.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY: Enforce two-person rule. Require an approved pending_sensitive_operations
    // row for this target, approved by a super admin other than the requester, within 1 hour.
    const { data: approvedOps, error: approvalError } = await adminClient
      .from('pending_sensitive_operations')
      .select('id, requested_by, approved_by, approved_at, status')
      .eq('target_user_id', user_id)
      .eq('operation_type', 'delete_staff')
      .eq('status', 'approved')
      .gte('approved_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

    if (approvalError) {
      console.error('Error checking approvals:', approvalError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify two-person approval' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const validApproval = (approvedOps || []).find(
      (op) => op.approved_by && op.approved_by !== op.requested_by
    )

    if (!validApproval) {
      console.log(`Security: Rejected delete_staff for ${user_id} — no valid two-person approval`)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'يتطلب حذف حساب موظف موافقة مدير عام آخر (قاعدة الشخصين). أنشئ طلب حذف واطلب من مدير عام آخر الموافقة عليه أولاً.',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if target user is staff (has admin or agent role)
    const { data: targetRoles } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)

    const isStaff = targetRoles?.some(r => r.role === 'admin' || r.role === 'agent')
    if (!isStaff) {
      return new Response(
        JSON.stringify({ success: false, error: 'This user is not a staff member' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY FIX: Check if target user has manage_staff permission (Super Admin)
    // Only Super Admins can delete other Super Admins
    const { data: targetHasManageStaff } = await adminClient.rpc('has_permission', { 
      _user_id: user_id, 
      _permission: 'manage_staff' 
    })

    if (targetHasManageStaff) {
      // Count how many super admins exist
      const { data: superAdmins, error: countError } = await adminClient
        .from('staff_permissions')
        .select('user_id')
        .eq('permission', 'manage_staff')

      if (countError) {
        console.error('Error counting super admins:', countError)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to verify super admin count' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Prevent deleting the last super admin
      const uniqueSuperAdmins = [...new Set(superAdmins?.map(s => s.user_id) || [])]
      if (uniqueSuperAdmins.length <= 1) {
        console.log(`Security: Prevented deletion of last super admin ${user_id}`)
        return new Response(
          JSON.stringify({ success: false, error: 'لا يمكن حذف آخر مدير عام في النظام. يجب وجود مدير عام واحد على الأقل.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Super admin ${callingUser.id} is deleting another super admin ${user_id}. Remaining super admins: ${uniqueSuperAdmins.length - 1}`)
    }

    // Log the activity before deletion
    await adminClient
      .from('role_activity_log')
      .insert({
        target_user_id: user_id,
        performed_by: callingUser.id,
        action: 'delete_staff',
        role: 'admin' // We use admin as placeholder for full deletion
      })

    // Delete staff permissions first
    await adminClient
      .from('staff_permissions')
      .delete()
      .eq('user_id', user_id)

    // Delete user roles
    await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', user_id)

    // Delete user profile
    await adminClient
      .from('profiles')
      .delete()
      .eq('user_id', user_id)

    // Delete the user from auth using admin API
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return new Response(
        JSON.stringify({ success: false, error: deleteError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Staff user ${user_id} deleted successfully by super admin ${callingUser.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Staff user deleted successfully'
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
