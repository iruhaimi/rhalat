import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  User, 
  Phone, 
  Globe, 
  Shield, 
  FileText,
  Loader2,
  Pencil,
  Check,
  X,
  Mail,
  Copy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import type { AppRole } from '@/types/database';
import { filterArabicChars, filterNonNumeric } from '@/lib/inputFilters';

interface UserData {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  nationality: string | null;
  created_at: string;
  roles: AppRole[];
  email?: string;
}

interface UserProfileDialogProps {
  user: UserData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  canEdit?: boolean;
}

const ROLE_LABELS: Record<AppRole, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  customer: { label: 'عميل', variant: 'secondary' },
  agent: { label: 'وكيل', variant: 'default' },
  admin: { label: 'مشرف', variant: 'destructive' },
  tour_operator: { label: 'منظم رحلات', variant: 'default' },
};

export function UserProfileDialog({ 
  user, 
  open, 
  onOpenChange, 
  onSuccess,
  canEdit = false 
}: UserProfileDialogProps) {
  const [applicationCount, setApplicationCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    nationality: '',
  });

  useEffect(() => {
    if (user && open) {
      fetchUserStats();
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        nationality: user.nationality || '',
      });
      setIsEditing(false);
    }
  }, [user, open]);

  const fetchUserStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setApplicationCount(count || 0);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          nationality: formData.nationality || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('تم تحديث بيانات المستخدم بنجاح');
      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('حدث خطأ في تحديث البيانات');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        nationality: user.nationality || '',
      });
    }
    setIsEditing(false);
  };

  const copyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      toast.success('تم نسخ البريد الإلكتروني');
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{user.full_name || 'غير محدد'}</p>
                <p className="text-xs text-muted-foreground font-normal">
                  {format(new Date(user.created_at), 'dd MMMM yyyy', { locale: ar })}
                </p>
              </div>
            </div>
            {canEdit && !isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-9 w-9"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {isEditing ? (
            // Edit Mode
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  الاسم الكامل
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="أدخل الاسم الكامل"
                />
              </div>

              {/* Email (Read-only) */}
              {user.email && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    البريد الإلكتروني
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={user.email}
                      readOnly
                      dir="ltr"
                      className="text-left bg-muted/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copyEmail}
                      title="نسخ البريد"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  رقم الجوال
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: filterNonNumeric(e.target.value) }))}
                  placeholder="أدخل رقم الجوال"
                  dir="ltr"
                  className="text-left"
                  inputMode="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality" className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  الجنسية
                </Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                  placeholder="أدخل الجنسية"
                />
              </div>
              
              {/* Edit Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Check className="h-4 w-4 ml-2" />
                  )}
                  حفظ التغييرات
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="h-4 w-4 ml-2" />
                  إلغاء
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <>
              {/* Email - Full Width */}
              {user.email && (
                <div className="space-y-1 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Mail className="h-3.5 w-3.5" />
                      البريد الإلكتروني
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={copyEmail}
                      title="نسخ البريد"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-medium text-sm" dir="ltr">{user.email}</p>
                </div>
              )}

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Phone className="h-3.5 w-3.5" />
                    رقم الجوال
                  </div>
                  <p className="font-medium text-sm" dir="ltr">{user.phone || '-'}</p>
                </div>
                
                <div className="space-y-1 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <Globe className="h-3.5 w-3.5" />
                    الجنسية
                  </div>
                  <p className="font-medium text-sm">{user.nationality || '-'}</p>
                </div>
              </div>

              {/* Roles */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Shield className="h-4 w-4" />
                  الصلاحيات
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <Badge key={role} variant={ROLE_LABELS[role].variant}>
                        {ROLE_LABELS[role].label}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">لا توجد صلاحيات</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                  <FileText className="h-4 w-4" />
                  إحصائيات
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 text-center">
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-primary">{applicationCount}</p>
                        <p className="text-xs text-muted-foreground">طلبات التأشيرة</p>
                      </>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold">{user.roles.length}</p>
                    <p className="text-xs text-muted-foreground">صلاحيات</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
