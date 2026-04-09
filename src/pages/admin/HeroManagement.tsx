import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Image, Eye, EyeOff, Type, BarChart3, Save, ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableDestinationRow } from '@/components/admin/SortableDestinationRow';

interface HeroDestination {
  id: string;
  name: string;
  name_en: string | null;
  country: string;
  country_en: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface HeroSetting {
  id: string;
  key: string;
  value: string;
  value_en: string | null;
  category: string;
  type: string;
  display_order: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export default function HeroManagement() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';

  return (
    <div className={cn("space-y-6", isRTL && "text-right")}>
      <div>
        <h1 className="text-2xl font-bold">إدارة قسم Hero</h1>
        <p className="text-muted-foreground">إدارة الوجهات والنصوص والإحصائيات في الصفحة الرئيسية</p>
      </div>

      <Tabs defaultValue="destinations" className="w-full">
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="destinations" className="gap-2">
            <Image className="h-4 w-4" />
            الوجهات
          </TabsTrigger>
          <TabsTrigger value="texts" className="gap-2">
            <Type className="h-4 w-4" />
            النصوص
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            الإحصائيات
          </TabsTrigger>
          <TabsTrigger value="background" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            الخلفية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="destinations" className="mt-6">
          <DestinationsManagement isRTL={isRTL} />
        </TabsContent>

        <TabsContent value="texts" className="mt-6">
          <TextsManagement isRTL={isRTL} category="general" title="النصوص الرئيسية" />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <TextsManagement isRTL={isRTL} category="stats" title="الإحصائيات والأرقام" />
        </TabsContent>

        <TabsContent value="background" className="mt-6">
          <BackgroundManagement isRTL={isRTL} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Destinations Management Component
function DestinationsManagement({ isRTL }: { isRTL: boolean }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<HeroDestination | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    country: '',
    image_url: '',
    display_order: 0,
    is_active: true,
  });

  const { data: destinations, isLoading } = useQuery({
    queryKey: ['admin-hero-destinations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_destinations')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as HeroDestination[];
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      country: '',
      image_url: '',
      display_order: destinations?.length || 0,
      is_active: true,
    });
    setEditingDestination(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const openEdit = (destination: HeroDestination) => {
    setEditingDestination(destination);
    setFormData({
      name: destination.name,
      country: destination.country,
      image_url: destination.image_url,
      display_order: destination.display_order,
      is_active: destination.is_active,
    });
    setImagePreview(destination.flag_url);
    setIsOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الصورة يجب أن يكون أقل من 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `hero-${Date.now()}.${fileExt}`;
    const filePath = `hero-destinations/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setIsUploading(true);
      let finalImageUrl = formData.image_url;

      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const payload = {
        name: formData.name,
        country: formData.country.toUpperCase(),
        image_url: finalImageUrl,
        display_order: formData.display_order,
        is_active: formData.is_active,
      };

      if (editingDestination) {
        const { error } = await supabase
          .from('hero_destinations')
          .update(payload)
          .eq('id', editingDestination.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hero_destinations')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-destinations'] });
      queryClient.invalidateQueries({ queryKey: ['hero-destinations'] });
      toast.success(editingDestination ? 'تم تحديث الوجهة بنجاح' : 'تم إضافة الوجهة بنجاح');
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hero_destinations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-destinations'] });
      queryClient.invalidateQueries({ queryKey: ['hero-destinations'] });
      toast.success('تم حذف الوجهة بنجاح');
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('hero_destinations')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-destinations'] });
      queryClient.invalidateQueries({ queryKey: ['hero-destinations'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; newOrder: number }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from('hero_destinations')
          .update({ display_order: update.newOrder })
          .eq('id', update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-destinations'] });
      queryClient.invalidateQueries({ queryKey: ['hero-destinations'] });
      toast.success('تم تحديث الترتيب بنجاح');
    },
    onError: (error) => {
      toast.error('حدث خطأ في تحديث الترتيب');
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && destinations) {
      const oldIndex = destinations.findIndex((d) => d.id === active.id);
      const newIndex = destinations.findIndex((d) => d.id === over.id);
      
      const newOrder = arrayMove(destinations, oldIndex, newIndex);
      const updates = newOrder.map((dest, index) => ({
        id: dest.id,
        newOrder: index + 1,
      }));
      
      reorderMutation.mutate(updates);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            الوجهات المميزة
          </CardTitle>
          <CardDescription>إدارة الوجهات التي تظهر في شريط العرض الرئيسي</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة وجهة
            </Button>
          </DialogTrigger>
          <DialogContent className={cn("max-w-lg", isRTL && "text-right")}>
            <DialogHeader>
              <DialogTitle>{editingDestination ? 'تعديل الوجهة' : 'إضافة وجهة جديدة'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم الدولة (عربي)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: الولايات المتحدة"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رمز الدولة (ISO)</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="مثال: US"
                    dir="ltr"
                    maxLength={3}
                  />
                </div>
              </div>

              {/* Flag URL */}
              <div className="space-y-2">
                <Label>رابط صورة العلم</Label>
                <Input
                  value={formData.flag_url}
                  onChange={(e) => {
                    setFormData({ ...formData, flag_url: e.target.value });
                    setImagePreview(e.target.value);
                    setImageFile(null);
                  }}
                  placeholder="https://flagcdn.com/w80/us.png"
                  dir="ltr"
                />
                {formData.code && !formData.flag_url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = `https://flagcdn.com/w80/${formData.code.toLowerCase()}.png`;
                      setFormData({ ...formData, flag_url: url });
                      setImagePreview(url);
                    }}
                  >
                    توليد رابط العلم تلقائياً
                  </Button>
                )}
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Flag preview"
                    className="h-10 rounded border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  يمكن استخدام: https://flagcdn.com/w80/[code].png
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>عرض الوجهة</Label>
              </div>

              <Button
                className="w-full"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || isUploading || !formData.name || !formData.code || !formData.flag_url}
              >
                {(saveMutation.isPending || isUploading) ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جاري الحفظ...
                  </>
                ) : (
                  editingDestination ? 'حفظ التغييرات' : 'إضافة الوجهة'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={isRTL ? "text-right" : ""}>الترتيب</TableHead>
                <TableHead className={isRTL ? "text-right" : ""}>العلم</TableHead>
                <TableHead className={isRTL ? "text-right" : ""}>الدولة</TableHead>
                <TableHead className={isRTL ? "text-right" : ""}>الرمز</TableHead>
                <TableHead className={isRTL ? "text-right" : ""}>الحالة</TableHead>
                <TableHead className={isRTL ? "text-right" : ""}>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {destinations && destinations.length > 0 ? (
                <SortableContext
                  items={destinations.map((d) => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {destinations.map((dest, index) => (
                    <SortableDestinationRow
                      key={dest.id}
                      destination={dest}
                      index={index}
                      onEdit={openEdit}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      onToggleActive={(id, is_active) =>
                        toggleActiveMutation.mutate({ id, is_active })
                      }
                    />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    لا توجد وجهات مضافة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </CardContent>
    </Card>
  );
}

// Texts/Stats Management Component
function TextsManagement({ isRTL, category, title }: { isRTL: boolean; category: string; title: string }) {
  const queryClient = useQueryClient();
  const [editedSettings, setEditedSettings] = useState<Record<string, { value: string; value_en: string }>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-hero-settings', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_settings')
        .select('*')
        .in('category', category === 'general' ? ['general', 'badge'] : ['stats'])
        .order('display_order');
      if (error) throw error;
      return data as HeroSetting[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(editedSettings).map(([id, values]) => 
        supabase
          .from('hero_settings')
          .update({ value: values.value, value_en: values.value_en })
          .eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-settings'] });
      queryClient.invalidateQueries({ queryKey: ['hero-settings'] });
      toast.success('تم حفظ التغييرات بنجاح');
      setEditedSettings({});
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const handleChange = (setting: HeroSetting, field: 'value' | 'value_en', newValue: string) => {
    setEditedSettings(prev => ({
      ...prev,
      [setting.id]: {
        value: field === 'value' ? newValue : (prev[setting.id]?.value ?? setting.value),
        value_en: field === 'value_en' ? newValue : (prev[setting.id]?.value_en ?? setting.value_en ?? ''),
      }
    }));
  };

  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      badge_text: 'نص الشارة',
      main_title_line1: 'العنوان الرئيسي (السطر الأول)',
      main_title_line2: 'العنوان الرئيسي (السطر الثاني)',
      description: 'الوصف',
      search_placeholder: 'نص حقل البحث',
      search_button: 'نص زر البحث',
      stat_success_rate: 'نسبة النجاح',
      stat_success_label: 'تسمية نسبة النجاح',
      stat_countries: 'عدد الدول',
      stat_countries_label: 'تسمية الدول',
      stat_support: 'الدعم',
      card_visas_count: 'عدد التأشيرات المنجزة',
      card_visas_label: 'تسمية التأشيرات',
      card_processing_time: 'متوسط وقت المعالجة',
      card_processing_label: 'تسمية المعالجة',
    };
    return labels[key] || key;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasChanges = Object.keys(editedSettings).length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            {category === 'general' ? <Type className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
            {title}
          </CardTitle>
          <CardDescription>
            {category === 'general' 
              ? 'تعديل النصوص الظاهرة في قسم Hero' 
              : 'تعديل الأرقام والإحصائيات'
            }
          </CardDescription>
        </div>
        {hasChanges && (
          <Button 
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="gap-2"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ التغييرات
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {settings?.map((setting) => {
            const currentValue = editedSettings[setting.id]?.value ?? setting.value;
            const currentValueEn = editedSettings[setting.id]?.value_en ?? setting.value_en ?? '';
            const isLongText = setting.key === 'description';

            return (
              <div key={setting.id} className="space-y-3 p-4 border rounded-lg bg-muted/20">
                <Label className="text-base font-medium">{getSettingLabel(setting.key)}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">عربي</Label>
                    {isLongText ? (
                      <Textarea
                        value={currentValue}
                        onChange={(e) => handleChange(setting, 'value', e.target.value)}
                        className="min-h-[100px]"
                      />
                    ) : (
                      <Input
                        value={currentValue}
                        onChange={(e) => handleChange(setting, 'value', e.target.value)}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">English</Label>
                    {isLongText ? (
                      <Textarea
                        value={currentValueEn}
                        onChange={(e) => handleChange(setting, 'value_en', e.target.value)}
                        className="min-h-[100px]"
                        dir="ltr"
                      />
                    ) : (
                      <Input
                        value={currentValueEn}
                        onChange={(e) => handleChange(setting, 'value_en', e.target.value)}
                        dir="ltr"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Background Image Management Component
function BackgroundManagement({ isRTL }: { isRTL: boolean }) {
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch current background setting
  const { data: bgSetting, isLoading } = useQuery({
    queryKey: ['admin-hero-background'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_settings')
        .select('*')
        .eq('key', 'background_image')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as HeroSetting | null;
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('حجم الصورة يجب أن يكون أقل من 10MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `hero-bg-${Date.now()}.${fileExt}`;
    const filePath = `hero-backgrounds/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      if (bgSetting) {
        const { error } = await supabase
          .from('hero_settings')
          .update({ value: imageUrl, updated_at: new Date().toISOString() })
          .eq('id', bgSetting.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hero_settings')
          .insert({
            key: 'background_image',
            label: 'صورة الخلفية',
            value: imageUrl,
            value_en: imageUrl,
            category: 'background',
            display_order: 0,
            is_active: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-background'] });
      queryClient.invalidateQueries({ queryKey: ['hero-settings'] });
      toast.success('تم تحديث صورة الخلفية بنجاح');
      setImageFile(null);
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    },
  });

  const handleSave = async () => {
    if (!imageFile && !imagePreview) {
      toast.error('يرجى اختيار صورة');
      return;
    }

    setIsUploading(true);
    try {
      let finalUrl = imagePreview || '';
      if (imageFile) {
        finalUrl = await uploadImage(imageFile);
      }
      await saveMutation.mutateAsync(finalUrl);
    } catch (error: any) {
      toast.error('حدث خطأ: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentBgUrl = imagePreview || bgSetting?.value || '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          صورة الخلفية
        </CardTitle>
        <CardDescription>
          تغيير صورة الخلفية الرئيسية في قسم Hero - يُفضل صورة بأبعاد 1920x1080 أو أكبر
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Background Preview */}
        <div className="space-y-3">
          <Label className="text-base">الصورة الحالية</Label>
          <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-border bg-muted">
            {currentBgUrl ? (
              <img
                src={currentBgUrl}
                alt="Hero Background"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-16 w-16 mb-2" />
                <span>لا توجد صورة خلفية محددة</span>
              </div>
            )}
          </div>
        </div>

        {/* Upload New Background */}
        <div className="space-y-3">
          <Label className="text-base">رفع صورة جديدة</Label>
          <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
            <label className="cursor-pointer block">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <span className="text-lg font-medium block mb-1">اضغط لرفع صورة جديدة</span>
              <span className="text-sm text-muted-foreground block">
                الحد الأقصى: 10MB - يُفضل أبعاد 1920x1080 أو أكبر
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>
          {imageFile && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <ImageIcon className="h-5 w-5 text-primary" />
              <span className="flex-1">{imageFile.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(bgSetting?.value || null);
                }}
              >
                إلغاء
              </Button>
            </div>
          )}
        </div>

        {/* Or URL Input */}
        <div className="space-y-3">
          <Label className="text-base">أو أدخل رابط الصورة</Label>
          <Input
            value={!imageFile ? (imagePreview || '') : ''}
            onChange={(e) => {
              setImagePreview(e.target.value);
              setImageFile(null);
            }}
            placeholder="https://example.com/background.jpg"
            dir="ltr"
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isUploading || saveMutation.isPending || (!imageFile && imagePreview === bgSetting?.value)}
          className="w-full gap-2"
          size="lg"
        >
          {(isUploading || saveMutation.isPending) ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              حفظ صورة الخلفية
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
