import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { User as UserIcon, Shield, MoreHorizontal, UserCog, Trash2, UserX, Mail, Copy, Settings2, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/types/database';
import { EditPermissionsDialog } from './EditPermissionsDialog';

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  nationality: string | null;
  created_at: string;
  roles: AppRole[];
  email?: string;
}

interface StaffUsersTableProps {
  users: UserWithRole[];
  onViewProfile: (user: UserWithRole) => void;
  onAddRole: (user: UserWithRole) => void;
  onDeleteRoles: (user: UserWithRole) => void;
  onRemoveRole: (userId: string, role: AppRole) => void;
  onDeleteStaff: (user: UserWithRole) => void;
  isAdmin: boolean;
  onRefresh?: () => void;
}

export function StaffUsersTable({
  users,
  onViewProfile,
  onAddRole,
  onDeleteRoles,
  onRemoveRole,
  onDeleteStaff,
  isAdmin,
  onRefresh,
}: StaffUsersTableProps) {
  const [editPermissionsUser, setEditPermissionsUser] = useState<UserWithRole | null>(null);
  const [ownerUserIds, setOwnerUserIds] = useState<Set<string>>(new Set());

  // Fetch which users have manage_staff permission (owners)
  useEffect(() => {
    const fetchOwners = async () => {
      const { data, error } = await supabase
        .from('staff_permissions')
        .select('user_id')
        .eq('permission', 'manage_staff');
      
      if (!error && data) {
        setOwnerUserIds(new Set(data.map(p => p.user_id)));
      }
    };
    fetchOwners();
  }, [users]);

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success('تم نسخ البريد الإلكتروني');
  };

  // Get role badge with owner detection
  const getRoleBadge = (role: AppRole, userId: string, clickable = false, onClick?: () => void) => {
    const isOwner = ownerUserIds.has(userId);
    
    // If user is an owner (has manage_staff permission), show "مالك" instead of "مشرف"
    if (role === 'admin' && isOwner) {
      return (
        <Badge 
          className={`text-xs px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 ${clickable ? 'cursor-pointer hover:opacity-80 transition-all hover:scale-105' : ''}`}
          onClick={onClick}
        >
          <Crown className="h-3 w-3 ml-1" />
          مالك
        </Badge>
      );
    }

    const config: Record<AppRole, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      customer: { label: 'عميل', variant: 'secondary' },
      agent: { label: 'وكيل', variant: 'default' },
      admin: { label: 'مشرف', variant: 'destructive' },
      tour_operator: { label: 'منظم رحلات', variant: 'outline' },
    };
    
    return (
      <Badge 
        variant={config[role].variant} 
        className={`text-xs px-2 py-0.5 ${clickable ? 'cursor-pointer hover:opacity-80 transition-all hover:scale-105' : ''}`}
        onClick={onClick}
      >
        {config[role].label}
      </Badge>
    );
  };

  // Get role indicator dot color and title
  const getRoleIndicator = (role: AppRole, userId: string) => {
    const isOwner = ownerUserIds.has(userId);
    if (role === 'admin' && isOwner) {
      return {
        color: 'bg-gradient-to-r from-amber-500 to-orange-500',
        title: 'مالك'
      };
    }
    if (role === 'admin') {
      return { color: 'bg-destructive', title: 'مشرف' };
    }
    if (role === 'agent') {
      return { color: 'bg-primary', title: 'وكيل' };
    }
    return { color: 'bg-muted-foreground', title: 'عميل' };
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <UserIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>لا يوجد موظفين مطابقين للبحث</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-right font-semibold">الموظف</TableHead>
              <TableHead className="text-right font-semibold">البريد الإلكتروني</TableHead>
              <TableHead className="text-right font-semibold">رقم الجوال</TableHead>
              <TableHead className="text-right font-semibold">تاريخ التسجيل</TableHead>
              <TableHead className="text-right font-semibold">الدور</TableHead>
              <TableHead className="text-right w-[80px] font-semibold">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((userItem) => (
              <TableRow key={userItem.id} className="group hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => onViewProfile(userItem)}
                      className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center hover:from-primary/30 hover:to-primary/15 transition-all duration-200 cursor-pointer shadow-sm"
                      title="عرض الملف الشخصي"
                    >
                      <UserIcon className="h-5 w-5 text-primary" />
                    </button>
                    <div className="min-w-0">
                      <button 
                        onClick={() => onViewProfile(userItem)}
                        className="font-medium hover:text-primary transition-colors cursor-pointer text-right block truncate max-w-[150px]"
                      >
                        {userItem.full_name || 'غير محدد'}
                      </button>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {userItem.roles.map((role) => {
                          const indicator = getRoleIndicator(role, userItem.user_id);
                          return (
                            <span 
                              key={role} 
                              className={`w-2 h-2 rounded-full ${indicator.color}`}
                              title={indicator.title}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {userItem.email ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1 max-w-[180px]">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate" dir="ltr" title={userItem.email}>
                          {userItem.email}
                        </span>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyEmail(userItem.email!)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>نسخ البريد</TooltipContent>
                      </Tooltip>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span dir="ltr" className="text-sm">{userItem.phone || '-'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(userItem.created_at), 'dd MMM yyyy', { locale: ar })}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {userItem.roles.length > 0 ? (
                      userItem.roles.map((role) => (
                        isAdmin ? (
                          <Tooltip key={role}>
                            <TooltipTrigger asChild>
                              <span>
                                {getRoleBadge(role, userItem.user_id, true, () => onRemoveRole(userItem.user_id, role))}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>اضغط لحذف الدور</TooltipContent>
                          </Tooltip>
                        ) : (
                          <span key={role}>{getRoleBadge(role, userItem.user_id)}</span>
                        )
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">لا يوجد</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => onViewProfile(userItem)}>
                        <UserCog className="h-4 w-4 ml-2" />
                        عرض وتعديل الملف
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => setEditPermissionsUser(userItem)}>
                            <Settings2 className="h-4 w-4 ml-2" />
                            تعديل الصلاحيات المفصلة
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAddRole(userItem)}>
                            <Shield className="h-4 w-4 ml-2" />
                            إضافة/تغيير الدور
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDeleteRoles(userItem)}
                            className="text-warning focus:text-warning focus:bg-accent"
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            إلغاء جميع الأدوار
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteStaff(userItem)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <UserX className="h-4 w-4 ml-2" />
                            حذف الحساب نهائياً
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Permissions Dialog */}
      <EditPermissionsDialog
        open={!!editPermissionsUser}
        onOpenChange={(open) => !open && setEditPermissionsUser(null)}
        userId={editPermissionsUser?.user_id || ''}
        userName={editPermissionsUser?.full_name || ''}
        onSuccess={() => {
          setEditPermissionsUser(null);
          onRefresh?.();
        }}
      />
    </TooltipProvider>
  );
}
