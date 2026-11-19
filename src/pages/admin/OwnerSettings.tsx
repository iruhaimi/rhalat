import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useSystemBackups } from '@/hooks/useSystemBackups';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Crown, Shield, UserPlus, Trash2, Users, AlertTriangle, Loader2, CheckCircle2, Download, Database, HardDrive, Calendar, FileArchive, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

interface StaffUser {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string;
  isOwner: boolean;
}

export default function OwnerSettings() {
  const { direction } = useLanguage();
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const queryClient = useQueryClient();
  const isRTL = direction === 'rtl';

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [confirmGrantDialog, setConfirmGrantDialog] = useState(false);
  const [confirmRevokeDialog, setConfirmRevokeDialog] = useState(false);
  const [targetUser, setTargetUser] = useState<StaffUser | null>(null);
  const [backupNotes, setBackupNotes] = useState('');

  // System backups
  const { backups, loading: loadingBackups, creating, createBackup, downloadBackup, deleteBackup } = useSystemBackups();

  // Fetch all admin staff
  const { data: staffUsers, isLoading: loadingStaff } = useQuery({
    queryKey: ['owner-staff-users'],
    queryFn: async () => {
      // Get all admins
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminUserIds = adminRoles.map(r => r.user_id);
      
      // Get profiles for admins
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url')
        .in('user_id', adminUserIds);

      if (profilesError) throw profilesError;

      // Get owners (those with manage_staff permission)
      const { data: owners, error: ownersError } = await supabase
        .from('staff_permissions')
        .select('user_id')
        .eq('permission', 'manage_staff');

      if (ownersError) throw ownersError;

      const ownerUserIds = new Set(owners.map(o => o.user_id));

      // Get emails for all admins
      const usersWithEmails: StaffUser[] = await Promise.all(
        profiles.map(async (profile) => {
          const { data: email } = await supabase.rpc('get_user_email', {
            target_user_id: profile.user_id
          });
          return {
            ...profile,
            email: email || '',
            isOwner: ownerUserIds.has(profile.user_id)
          };
        })
      );

      return usersWithEmails;
    },
    enabled: isSuperAdmin
  });

  // Get current owners
  const owners = staffUsers?.filter(u => u.isOwner) || [];
  const nonOwners = staffUsers?.filter(u => !u.isOwner) || [];

  // Grant owner permission
  const grantOwnerMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('staff_permissions')
        .insert({
          user_id: userId,
          permission: 'manage_staff',
          granted_by: user?.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم منح صلاحية المالك بنجاح');
      queryClient.invalidateQueries({ queryKey: ['owner-staff-users'] });
      setConfirmGrantDialog(false);
      setSelectedUserId('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في منح الصلاحية');
    }
  });

  // Revoke owner permission (through sensitive operations)
  const requestRevokeMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user) throw new Error('يجب تسجيل الدخول');
      // Check if this is the last owner
      if (owners.length <= 1) {
        throw new Error('لا يمكن إزالة صلاحية المالك من آخر مالك في النظام');
      }

      // Create pending sensitive operation
      const { error } = await supabase
        .from('pending_sensitive_operations')
        .insert({
          operation_type: 'remove_manage_staff_permission',
          target_user_id: targetUserId,
          requested_by: user.id,
          request_reason: 'طلب إزالة صلاحية المالك'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إرسال طلب إزالة صلاحية المالك للموافقة');
      setConfirmRevokeDialog(false);
      setTargetUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ في إرسال الطلب');
    }
  });

  const handleGrantOwner = () => {
    if (!selectedUserId) return;
    const selectedUser = nonOwners.find(u => u.user_id === selectedUserId);
    setTargetUser(selectedUser || null);
    setConfirmGrantDialog(true);
  };

  const handleRevokeOwner = (ownerUser: StaffUser) => {
    if (ownerUser.user_id === user?.id) {
      toast.error('لا يمكنك إزالة صلاحية المالك من نفسك');
      return;
    }
    setTargetUser(ownerUser);
    setConfirmRevokeDialog(true);
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
            <p className="text-muted-foreground">
              هذه الصفحة متاحة فقط لمالكي الموقع
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", isRTL && "text-right")}>
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <div className="p-3 bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-xl">
          <Crown className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-l from-amber-600 to-amber-500 bg-clip-text text-transparent">
            إعدادات المالك
          </h1>
          <p className="text-muted-foreground">
            إدارة صلاحيات المالكين في النظام
          </p>
        </div>
      </div>

      {/* Warning */}
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning">تحذير مهم</p>
              <p className="text-sm text-muted-foreground mt-1">
                صلاحية المالك تمنح التحكم الكامل في النظام بما في ذلك إدارة الموظفين وجميع الإعدادات. 
                امنح هذه الصلاحية فقط للأشخاص الموثوق بهم.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Owners */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              المالكون الحاليون
            </CardTitle>
            <CardDescription>
              قائمة بجميع المستخدمين الذين يملكون صلاحية المالك
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStaff ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : owners.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا يوجد مالكون
              </p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {owners.map((owner) => (
                    <div
                      key={owner.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-amber-500/5 to-transparent"
                    >
                      <Avatar className="h-10 w-10 border-2 border-amber-500/30">
                        <AvatarImage src={owner.avatar_url || undefined} />
                        <AvatarFallback className="bg-amber-500/10 text-amber-700">
                          {owner.full_name?.charAt(0) || 'م'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {owner.full_name || 'بدون اسم'}
                          </span>
                          {owner.user_id === user?.id && (
                            <Badge variant="outline" className="text-xs">أنت</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {owner.email}
                        </p>
                      </div>
                      {owner.user_id !== user?.id && owners.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleRevokeOwner(owner)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Grant Owner Permission */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              منح صلاحية المالك
            </CardTitle>
            <CardDescription>
              اختر مشرفاً لمنحه صلاحية المالك الكاملة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingStaff ? (
              <Skeleton className="h-10 w-full" />
            ) : nonOwners.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  جميع المشرفين لديهم صلاحية المالك بالفعل
                </p>
              </div>
            ) : (
              <>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مشرفاً..." />
                  </SelectTrigger>
                  <SelectContent>
                    {nonOwners.map((staff) => (
                      <SelectItem key={staff.user_id} value={staff.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={staff.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {staff.full_name?.charAt(0) || 'م'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{staff.full_name || staff.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  className="w-full gap-2"
                  onClick={handleGrantOwner}
                  disabled={!selectedUserId || grantOwnerMutation.isPending}
                >
                  {grantOwnerMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Crown className="h-4 w-4" />
                  )}
                  منح صلاحية المالك
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-amber-500/10">
              <Crown className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-600">{owners.length}</p>
              <p className="text-sm text-muted-foreground">مالك</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{staffUsers?.length || 0}</p>
              <p className="text-sm text-muted-foreground">إجمالي المشرفين</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald-600">{nonOwners.length}</p>
              <p className="text-sm text-muted-foreground">مشرف عادي</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold">∞</p>
              <p className="text-sm text-muted-foreground">صلاحيات كاملة</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            النسخ الاحتياطي
          </CardTitle>
          <CardDescription>
            إنشاء وإدارة النسخ الاحتياطية لقاعدة البيانات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create Backup */}
          <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">إنشاء نسخة احتياطية جديدة</h3>
                <p className="text-sm text-muted-foreground">
                  سيتم تصدير جميع البيانات الأساسية في ملف ZIP
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backup-notes">ملاحظات (اختياري)</Label>
              <Input
                id="backup-notes"
                placeholder="مثال: نسخة قبل التحديث الكبير..."
                value={backupNotes}
                onChange={(e) => setBackupNotes(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                createBackup(backupNotes || undefined);
                setBackupNotes('');
              }}
              disabled={creating}
              className="w-full gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  إنشاء وتحميل نسخة احتياطية
                </>
              )}
            </Button>
          </div>

          {/* Backup History */}
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              سجل النسخ الاحتياطية
            </h3>
            {loadingBackups ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileArchive className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد نسخ احتياطية سابقة</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {backups.map((backup) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <FileArchive className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{backup.file_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(backup.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                            <span>•</span>
                            <span>{((backup.file_size ?? 0) / 1024).toFixed(1)} KB</span>
                          </div>
                          {backup.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{backup.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadBackup(backup)}
                          title="تحميل"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => deleteBackup(backup.id)}
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>


      <AlertDialog open={confirmGrantDialog} onOpenChange={setConfirmGrantDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              تأكيد منح صلاحية المالك
            </AlertDialogTitle>
            <AlertDialogDescription>
              أنت على وشك منح صلاحية المالك لـ <strong>{targetUser?.full_name || targetUser?.email}</strong>.
              <br /><br />
              سيتمكن هذا المستخدم من:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>إدارة جميع الموظفين والمشرفين</li>
                <li>منح وإزالة صلاحية المالك لآخرين</li>
                <li>الوصول لجميع إعدادات النظام</li>
                <li>عرض جميع البيانات المالية والإيرادات</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => grantOwnerMutation.mutate(selectedUserId)}
              disabled={grantOwnerMutation.isPending}
            >
              {grantOwnerMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              تأكيد المنح
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={confirmRevokeDialog} onOpenChange={setConfirmRevokeDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              تأكيد إزالة صلاحية المالك
            </AlertDialogTitle>
            <AlertDialogDescription>
              أنت على وشك طلب إزالة صلاحية المالك من <strong>{targetUser?.full_name || targetUser?.email}</strong>.
              <br /><br />
              <span className="text-warning font-medium">
                ⚠️ هذه العملية تتطلب موافقة مالك آخر للتنفيذ (نظام الموافقة الثنائية).
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => requestRevokeMutation.mutate(targetUser?.user_id || '')}
              disabled={requestRevokeMutation.isPending}
            >
              {requestRevokeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              إرسال طلب الإزالة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
