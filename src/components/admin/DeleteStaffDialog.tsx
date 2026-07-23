import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2, AlertTriangle, Shield, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AppRole } from '@/types/database';
import { usePermissions } from '@/hooks/usePermissions';

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  nationality: string | null;
  created_at: string;
  roles: AppRole[];
}

interface DeleteStaffDialogProps {
  user: UserWithRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteStaffDialog({ user, open, onOpenChange, onSuccess }: DeleteStaffDialogProps) {
  const [loading, setLoading] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(false);
  const [targetIsSuperAdmin, setTargetIsSuperAdmin] = useState(false);
  const [superAdminCount, setSuperAdminCount] = useState(0);
  const [reason, setReason] = useState('');
  const { isSuperAdmin: currentUserIsSuperAdmin } = usePermissions();

  useEffect(() => {
    if (open && user) {
      checkTargetPermissions();
      setReason('');
    }
  }, [open, user]);

  const checkTargetPermissions = async () => {
    if (!user) return;
    
    setCheckingPermissions(true);
    try {
      // Check if target user is a super admin
      const { data: targetPerms } = await supabase
        .from('staff_permissions')
        .select('permission')
        .eq('user_id', user.user_id)
        .eq('permission', 'manage_staff');

      setTargetIsSuperAdmin((targetPerms?.length || 0) > 0);

      // Count total super admins
      const { data: allSuperAdmins } = await supabase
        .from('staff_permissions')
        .select('user_id')
        .eq('permission', 'manage_staff');

      const uniqueUsers = [...new Set(allSuperAdmins?.map(d => d.user_id) || [])];
      setSuperAdminCount(uniqueUsers.length);
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setCheckingPermissions(false);
    }
  };

  const handleRequestDelete = async () => {
    if (!user || !reason.trim()) {
      toast.error('يرجى إدخال سبب الحذف');
      return;
    }

    // Extra security check: Prevent deleting last super admin
    if (targetIsSuperAdmin && superAdminCount <= 1) {
      toast.error('لا يمكن حذف آخر مدير عام في النظام');
      return;
    }

    // Check if current user has permission
    if (!currentUserIsSuperAdmin) {
      toast.error('ليس لديك صلاحية حذف الموظفين');
      return;
    }

    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('غير مصرح');

      // Create a pending sensitive operation
      const insertData = {
        operation_type: 'delete_staff',
        target_user_id: user.user_id,
        requested_by: currentUser.id,
        request_reason: reason,
        operation_data: { user_name: user.full_name },
      };

      const { error } = await supabase
        .from('pending_sensitive_operations')
        .insert(insertData as any);

      if (error) throw error;

      toast.success('تم إنشاء طلب الحذف - في انتظار موافقة مدير عام آخر');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating delete request:', error);
      toast.error(error.message || 'حدث خطأ في إنشاء الطلب');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isLastSuperAdmin = targetIsSuperAdmin && superAdminCount <= 1;
  const canRequestDelete = currentUserIsSuperAdmin && !isLastSuperAdmin;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            طلب حذف حساب الموظف
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right space-y-2">
            <p>
              هل أنت متأكد من طلب حذف حساب <strong>{user.full_name || 'هذا الموظف'}</strong>؟
            </p>
            
            {checkingPermissions ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : isLastSuperAdmin ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mt-3">
                <p className="text-destructive text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  لا يمكن حذف آخر مدير عام
                </p>
                <p className="text-destructive/80 text-sm mt-2">
                  هذا المستخدم هو المدير العام الوحيد في النظام. يجب تعيين مدير عام آخر قبل حذف هذا الحساب.
                </p>
              </div>
            ) : !currentUserIsSuperAdmin ? (
              <div className="bg-warning/10 border border-warning/20 rounded-md p-3 mt-3">
                <p className="text-warning text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  ليس لديك صلاحية
                </p>
                <p className="text-warning/80 text-sm mt-2">
                  حذف حسابات الموظفين متاح فقط للمدراء العامين (من يملك صلاحية إدارة الموظفين).
                </p>
              </div>
            ) : (
              <>
                <div className="bg-primary/10 border border-primary/20 rounded-md p-3 mt-3">
                  <p className="text-primary text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    موافقة ثنائية مطلوبة
                  </p>
                  <p className="text-primary/80 text-sm mt-2">
                    سيتم إرسال طلب الحذف إلى مدير عام آخر للموافقة عليه قبل التنفيذ.
                  </p>
                </div>
                
                <div className="mt-4">
                  <label className="text-sm font-medium mb-2 block">سبب الحذف <span className="text-destructive">*</span></label>
                  <Textarea
                    placeholder="أدخل سبب حذف هذا الموظف..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="bg-warning/10 border border-warning/20 rounded-md p-3 mt-3">
                  <p className="text-warning text-sm font-medium">
                    ⚠️ تحذير: بعد الموافقة لا يمكن التراجع عن هذا الإجراء!
                  </p>
                </div>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={loading}>إلغاء</AlertDialogCancel>
          <Button
            onClick={handleRequestDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={loading || !canRequestDelete || checkingPermissions || !reason.trim()}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            <Trash2 className="h-4 w-4 ml-2" />
            طلب الحذف
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
