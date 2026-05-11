import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Loader2, UserPlus, Eye, EyeOff, Crown, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { filterArabicChars, filterNonNumeric } from '@/lib/inputFilters';
import type { AppRole } from '@/types/database';

interface CreateStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateStaffDialog({ open, onOpenChange, onSuccess }: CreateStaffDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [grantSuperAdmin, setGrantSuperAdmin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: '' as AppRole | '',
  });

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      role: '',
    });
    setShowPassword(false);
    setGrantSuperAdmin(false);
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password || !formData.role) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-staff-user', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          role: formData.role,
          grantSuperAdmin: formData.role === 'admin' && grantSuperAdmin,
        }
      });

      // Helper function to translate error messages
      const translateError = (errorMessage: string): string => {
        if (errorMessage.includes('already registered') || errorMessage.includes('email_exists')) {
          return 'هذا البريد الإلكتروني مسجل مسبقاً';
        } else if (errorMessage.includes('Invalid email')) {
          return 'البريد الإلكتروني غير صالح';
        } else if (errorMessage.includes('weak password') || errorMessage.includes('Password')) {
          return 'كلمة المرور ضعيفة جداً';
        }
        return errorMessage;
      };

      // Handle edge function error response (non-2xx status codes)
      if (error) {
        console.error('Edge function error:', error);
        
        // Try to extract detailed error from response context
        if (error.context && typeof error.context.json === 'function') {
          try {
            const responseBody = await error.context.json();
            if (responseBody?.error) {
              throw new Error(translateError(responseBody.error));
            }
          } catch (parseError) {
            // If it's already our translated error, rethrow it
            if (parseError instanceof Error && !parseError.message.includes('Edge Function')) {
              throw parseError;
            }
            // Otherwise fall through to generic error
          }
        }
        
        throw new Error('حدث خطأ في الاتصال بالخادم');
      }

      // Handle application-level error in response (2xx status but success: false)
      if (data && !data.success) {
        throw new Error(translateError(data.error || 'فشل في إنشاء الحساب'));
      }

      toast.success('تم إنشاء حساب الموظف بنجاح');
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating staff:', error);
      toast.error(error.message || 'حدث خطأ في إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            إنشاء حساب موظف جديد
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات الموظف الجديد. سيتم إنشاء الحساب مباشرة بدون الحاجة للتحقق من البريد.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="staff_email">البريد الإلكتروني *</Label>
            <Input
              id="staff_email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                email: filterArabicChars(e.target.value) 
              }))}
              placeholder="staff@example.com"
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff_password">كلمة المرور *</Label>
            <div className="relative">
              <Input
                id="staff_password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="6 أحرف على الأقل"
                dir="ltr"
                className="text-left pl-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff_name">الاسم الكامل</Label>
            <Input
              id="staff_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="أدخل الاسم الكامل"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff_phone">رقم الجوال</Label>
            <Input
              id="staff_phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                phone: filterNonNumeric(e.target.value) 
              }))}
              placeholder="05XXXXXXXX"
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff_role">الصلاحية *</Label>
            <Select
              value={formData.role}
              onValueChange={(value: AppRole) => {
                setFormData(prev => ({ ...prev, role: value }));
                if (value !== 'admin') setGrantSuperAdmin(false);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الصلاحية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">وكيل</span>
                    <span className="text-xs text-muted-foreground">مراجعة ومعالجة الطلبات المُعيّنة فقط</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">مشرف</span>
                    <span className="text-xs text-muted-foreground">إدارة الطلبات والتقارير والإعدادات</span>
                  </div>
                </SelectItem>
                <SelectItem value="tour_operator">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">وكيل سفر وسياحة</span>
                    <span className="text-xs text-muted-foreground">إدارة برامج سياحية فقط — بوابة منفصلة</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Super Admin Option - Only visible when admin role is selected */}
          {formData.role === 'admin' && (
            <div className="p-4 rounded-lg border-2 border-dashed border-warning/50 bg-warning/5 space-y-3">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-warning" />
                <div className="flex-1">
                  <p className="font-medium text-sm">صلاحية المدير العام</p>
                  <p className="text-xs text-muted-foreground">يمنح جميع الصلاحيات بما في ذلك إدارة الموظفين</p>
                </div>
                <Checkbox
                  id="grant_super_admin"
                  checked={grantSuperAdmin}
                  onCheckedChange={(checked) => setGrantSuperAdmin(checked === true)}
                />
              </div>
              {grantSuperAdmin && (
                <div className="flex items-center gap-2 p-2 rounded bg-warning/10 text-warning text-xs">
                  <Shield className="h-4 w-4" />
                  <span>سيتم منح هذا المستخدم صلاحيات كاملة على النظام</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            إنشاء الحساب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
