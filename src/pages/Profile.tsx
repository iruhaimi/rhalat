import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Phone, Save, Loader2, Camera, Upload, FileText, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import CountryCodePicker from '@/components/ui/CountryCodePicker';
import { filterNonNumeric as filterPhoneNonNumeric } from '@/lib/inputFilters';
import NoIndex from '@/components/seo/NoIndex';

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { direction } = useLanguage();
  const { toast } = useToast();
  const isRTL = direction === 'rtl';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    countryCode: '+966',
  });

  useEffect(() => {
    if (profile) {
      let countryCode = '+966';
      let phoneNumber = profile.phone || '';
      
      if (phoneNumber.startsWith('+')) {
        const codes = ['+966', '+971', '+973', '+974', '+965', '+968', '+20', '+962', '+961', '+963', '+964', '+967', '+970', '+212', '+213', '+216', '+218', '+249', '+90', '+44', '+1', '+33', '+49', '+91', '+92', '+60', '+62', '+86'];
        for (const code of codes) {
          if (phoneNumber.startsWith(code)) {
            countryCode = code;
            phoneNumber = phoneNumber.slice(code.length);
            break;
          }
        }
      }
      
      setFormData({
        full_name: profile.full_name || '',
        phone: phoneNumber,
        countryCode: countryCode,
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'phone' ? filterPhoneNonNumeric(value) : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handlePhoneInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    let filtered = filterPhoneNonNumeric(input.value);
    if (filtered.length > 9) {
      filtered = filtered.slice(0, 9);
    }
    if (filtered !== input.value) {
      input.value = filtered;
      setFormData(prev => ({ ...prev, phone: filtered }));
    }
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'يرجى اختيار ملف صورة' : 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت' : 'Image size must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await refreshProfile();

      toast({
        title: isRTL ? 'تم الرفع' : 'Uploaded',
        description: isRTL ? 'تم تحديث صورتك الشخصية بنجاح' : 'Your profile picture has been updated',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ أثناء رفع الصورة' : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsLoading(true);
    try {
      const fullPhone = formData.phone ? `${formData.countryCode}${formData.phone}` : null;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          phone: fullPhone,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      
      toast({
        title: isRTL ? 'تم الحفظ' : 'Saved',
        description: isRTL ? 'تم تحديث بياناتك بنجاح' : 'Your profile has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ أثناء تحديث البيانات' : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const labels = {
    pageTitle: isRTL ? 'الملف الشخصي' : 'Profile',
    personalInfo: isRTL ? 'المعلومات الشخصية' : 'Personal Information',
    fullName: isRTL ? 'الاسم الكامل' : 'Full Name',
    email: isRTL ? 'البريد الإلكتروني' : 'Email',
    phone: isRTL ? 'رقم الهاتف' : 'Phone Number',
    save: isRTL ? 'حفظ التغييرات' : 'Save Changes',
    saving: isRTL ? 'جاري الحفظ...' : 'Saving...',
    changePhoto: isRTL ? 'تغيير الصورة' : 'Change Photo',
    uploading: isRTL ? 'جاري الرفع...' : 'Uploading...',
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-canvas" dir={direction}>
      <NoIndex />
      {/* Hero band */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy/95 to-brand text-white">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, hsl(var(--brand)/0.4), transparent 50%)' }} />
        <div className="container mx-auto px-4 py-12 relative">
          <div className="max-w-2xl mx-auto flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 ring-4 ring-white/20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-2xl bg-white/15 text-white font-display font-black">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          
          <div className="flex-1">
            <h1 className="font-heading-ar text-3xl md:text-4xl font-black text-white">{profile?.full_name || labels.pageTitle}</h1>
            <p className="text-white/70 mt-1">{user?.email}</p>
            <Button 
              variant="secondary"
              size="sm" 
              className="mt-3 rounded-xl bg-white text-navy hover:bg-white/90"
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {labels.uploading}
                </>
              ) : (
                <>
                  <Upload className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {labels.changePhoto}
                </>
              )}
            </Button>
          </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-8 pb-16 relative">
        <div className="max-w-2xl mx-auto">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card className="rounded-3xl border-border shadow-xl shadow-navy/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading-ar text-navy">
                <User className="h-5 w-5 text-brand" />
                {labels.personalInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">{labels.fullName}</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder={labels.fullName}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">{labels.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">{labels.phone}</Label>
                <div className="flex gap-2 flex-row-reverse">
                  <CountryCodePicker
                    value={formData.countryCode}
                    onChange={(value) => setFormData(prev => ({ ...prev, countryCode: value }))}
                    isRTL={isRTL}
                  />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    dir="ltr"
                    lang="en"
                    inputMode="numeric"
                    maxLength={9}
                    style={{ textAlign: 'left' }}
                    value={formData.phone}
                    onChange={handleInputChange}
                    onInput={handlePhoneInput}
                    placeholder="5XXXXXXXX"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="rounded-3xl border-border shadow-xl shadow-navy/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading-ar text-navy">
                {isRTL ? 'روابط سريعة' : 'Quick Links'}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Link 
                to="/my-applications" 
                className="flex items-center justify-between p-4 rounded-2xl border border-border hover:border-navy/30 hover:shadow-md hover:-translate-y-0.5 transition-all group bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-navy/10 text-navy">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="font-medium">
                    {isRTL ? 'طلباتي' : 'My Applications'}
                  </span>
                </div>
                {isRTL ? (
                  <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </Link>
              
              <Link 
                to="/track-refund" 
                className="flex items-center justify-between p-4 rounded-2xl border border-border hover:border-navy/30 hover:shadow-md hover:-translate-y-0.5 transition-all group bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-brand/10 text-brand">
                    <RotateCcw className="h-5 w-5" />
                  </div>
                  <span className="font-medium">
                    {isRTL ? 'تتبع حالة الاسترداد' : 'Track Refund Status'}
                  </span>
                </div>
                {isRTL ? (
                  <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </Link>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} size="lg" className="rounded-2xl bg-navy hover:bg-navy/90 text-white h-12 px-8">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {labels.saving}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {labels.save}
                </>
              )}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
