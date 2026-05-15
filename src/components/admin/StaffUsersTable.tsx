import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { User as UserIcon, Shield, MoreHorizontal, UserCog, Trash2, UserX, Settings2, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/types/database';
import { EditPermissionsDialog } from './EditPermissionsDialog';
import { AdminTable, AdminTableBody, AdminTableRow, AdminTableCell, EmailCell } from './AdminTable';

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

  // Initials + color hash for avatar
  const getInitials = (name: string | null) => {
    if (!name) return '؟';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return (first + second).toUpperCase() || '؟';
  };

  const avatarPalette = [
    'from-sky-500/30 to-sky-500/10 text-sky-700 dark:text-sky-300',
    'from-emerald-500/30 to-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    'from-violet-500/30 to-violet-500/10 text-violet-700 dark:text-violet-300',
    'from-rose-500/30 to-rose-500/10 text-rose-700 dark:text-rose-300',
    'from-amber-500/30 to-amber-500/10 text-amber-700 dark:text-amber-300',
    'from-cyan-500/30 to-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  ];
  const getAvatarTone = (key: string) => {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return avatarPalette[h % avatarPalette.length];
  };

  // Owner badge (separate from role badges so it appears regardless of role)
  const OwnerBadge = () => (
    <Badge className="text-xs px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm">
      <Crown className="h-3 w-3 ml-1" />
      مالك
    </Badge>
  );

  // Standard role badge (no longer overrides admin → مالك; that's handled by OwnerBadge)
  const getRoleBadge = (role: AppRole, _userId: string, clickable = false, onClick?: () => void) => {
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
    if (isOwner) {
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
    <>
      <AdminTable
        minWidth="1100px"
        columns={[
          { width: '260px', label: 'الموظف' },
          { width: '280px', label: 'البريد الإلكتروني' },
          { width: '140px', label: 'رقم الجوال' },
          { width: '160px', label: 'تاريخ التسجيل' },
          { width: '180px', label: 'الدور' },
          { width: '80px', label: 'إجراءات' },
        ]}
      >
        <AdminTableBody>
            {users.map((userItem) => (
              <AdminTableRow key={userItem.id} className="group hover:bg-muted/30 transition-colors h-[68px]">
                <AdminTableCell className="align-middle">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onViewProfile(userItem)}
                      className={`relative h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarTone(userItem.user_id)} flex items-center justify-center font-semibold text-sm hover:scale-105 transition-all duration-200 cursor-pointer shadow-sm`}
                      title="عرض الملف الشخصي"
                    >
                      {getInitials(userItem.full_name)}
                      {ownerUserIds.has(userItem.user_id) && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow ring-2 ring-background" title="مالك">
                          <Crown className="h-2.5 w-2.5 text-white" />
                        </span>
                      )}
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
                </AdminTableCell>
                <AdminTableCell className="align-middle">
                  <EmailCell email={userItem.email} />
                </AdminTableCell>
                <AdminTableCell className="align-middle">
                  <div className="flex items-center min-h-[40px]">
                    <span dir="ltr" className="text-sm tabular-nums">{userItem.phone || '-'}</span>
                  </div>
                </AdminTableCell>
                <AdminTableCell className="align-middle">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center min-h-[40px]">
                        <span className="text-sm whitespace-nowrap">
                          {format(new Date(userItem.created_at), 'dd MMM yyyy', { locale: ar })}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {format(new Date(userItem.created_at), 'EEEE dd MMMM yyyy - HH:mm', { locale: ar })}
                      {' • '}
                      {formatDistanceToNow(new Date(userItem.created_at), { locale: ar, addSuffix: true })}
                    </TooltipContent>
                  </Tooltip>
                </AdminTableCell>
                <AdminTableCell className="align-middle">
                  <div className="flex flex-wrap items-center gap-1 min-h-[40px]">
                    {ownerUserIds.has(userItem.user_id) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span><OwnerBadge /></span>
                        </TooltipTrigger>
                        <TooltipContent>صلاحية مدير عام (manage_staff)</TooltipContent>
                      </Tooltip>
                    )}
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
                    ) : !ownerUserIds.has(userItem.user_id) ? (
                      <span className="text-xs text-muted-foreground">لا يوجد</span>
                    ) : null}
                  </div>
                </AdminTableCell>
                <AdminTableCell className="align-middle">
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
                </AdminTableCell>
              </AdminTableRow>
            ))}
        </AdminTableBody>
      </AdminTable>

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
    </>
  );
}
