import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Shield, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/types/database';

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

interface RoleOption {
  value: AppRole;
  label: string;
  description: string;
}

interface AddRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: UserWithRole | null;
  newRole: AppRole | '';
  onNewRoleChange: (role: AppRole | '') => void;
  onAddRole: () => void;
  updating: boolean;
  roleOptions: RoleOption[];
}

export function AddRoleDialog({
  open,
  onOpenChange,
  selectedUser,
  newRole,
  onNewRoleChange,
  onAddRole,
  updating,
  roleOptions,
}: AddRoleDialogProps) {
  const [isOwner, setIsOwner] = useState(false);

  // Check if selected user is an owner (has manage_staff permission)
  useEffect(() => {
    const checkOwnerStatus = async () => {
      if (!selectedUser) {
        setIsOwner(false);
        return;
      }

      const { data, error } = await supabase
        .from('staff_permissions')
        .select('permission')
        .eq('user_id', selectedUser.user_id)
        .eq('permission', 'manage_staff')
        .maybeSingle();

      setIsOwner(!error && !!data);
    };

    if (open && selectedUser) {
      checkOwnerStatus();
    }
  }, [open, selectedUser]);

  // Get role badge with owner detection
  const getRoleBadgeWithOwner = (role: AppRole, userIsOwner: boolean) => {
    // If user is an owner (has manage_staff permission), show "مالك" instead of "مشرف"
    if (role === 'admin' && userIsOwner) {
      return (
        <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-warning to-warning/80 text-warning-foreground border-0">
          <Crown className="h-3 w-3 ml-1" />
          مالك (صلاحيات كاملة)
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
      <Badge variant={config[role].variant} className="text-xs px-3 py-1">
        {config[role].label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            إضافة صلاحية لـ {selectedUser?.full_name || 'المستخدم'}
          </DialogTitle>
          <DialogDescription>
            اختر الصلاحية التي تريد منحها لهذا المستخدم
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>الصلاحية</Label>
            <Select value={newRole} onValueChange={(v) => onNewRoleChange(v as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الصلاحية" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.filter(r => !selectedUser?.roles.includes(r.value)).length > 0 ? (
                  roleOptions.filter(r => !selectedUser?.roles.includes(r.value)).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="py-2 px-3 text-sm text-muted-foreground">
                    لا توجد صلاحيات متاحة للإضافة
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {selectedUser && selectedUser.roles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">الصلاحيات الحالية</Label>
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/50 border">
                {selectedUser.roles.map(role => (
                  <span key={role}>{getRoleBadgeWithOwner(role, isOwner)}</span>
                ))}
              </div>
              {isOwner && (
                <p className="text-xs text-warning flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  هذا المستخدم مالك للموقع ولديه صلاحيات كاملة
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={onAddRole} disabled={!newRole || updating}>
            {updating && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            إضافة الصلاحية
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
