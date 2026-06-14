import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import WorkingHoursEditor from '@/components/admin/WorkingHoursEditor';
import { parseWorkingHours, formatWorkingHours } from '@/lib/workingHours';
import { 
  Phone, 
  Mail, 
  Clock, 
  Twitter, 
  Instagram, 
  Facebook, 
  Plus, 
  Pencil, 
  Trash2, 
  Save,
  Building2,
  Link as LinkIcon,
  Share2,
   FileText,
   ExternalLink,
   FileCheck
} from 'lucide-react';

interface FooterSetting {
  id: string;
  category: string;
  key: string;
  label: string;
  value: string;
  value_en: string | null;
  icon: string | null;
  url: string | null;
  display_order: number;
  is_active: boolean;
}

const categoryLabels: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  contact: { 
    label: 'معلومات التواصل', 
    icon: <Phone className="h-5 w-5" />,
    description: 'أرقام الهاتف والبريد الإلكتروني وساعات العمل'
  },
  social: { 
    label: 'وسائل التواصل الاجتماعي', 
    icon: <Share2 className="h-5 w-5" />,
    description: 'روابط حسابات التواصل الاجتماعي'
  },
  general: { 
    label: 'معلومات عامة', 
    icon: <Building2 className="h-5 w-5" />,
    description: 'اسم الشركة والوصف والإشعارات القانونية'
  },
   quick_links: { 
     label: 'روابط سريعة', 
     icon: <ExternalLink className="h-5 w-5" />,
     description: 'روابط التنقل السريع في الموقع'
   },
   policies: { 
     label: 'السياسات', 
     icon: <FileCheck className="h-5 w-5" />,
     description: 'روابط صفحات السياسات والشروط'
   },
};

const iconOptions = [
  { value: 'Phone', label: 'هاتف', icon: <Phone className="h-4 w-4" /> },
  { value: 'Mail', label: 'بريد', icon: <Mail className="h-4 w-4" /> },
  { value: 'Clock', label: 'ساعة', icon: <Clock className="h-4 w-4" /> },
  { value: 'Twitter', label: 'تويتر', icon: <Twitter className="h-4 w-4" /> },
  { value: 'Instagram', label: 'انستغرام', icon: <Instagram className="h-4 w-4" /> },
  { value: 'Facebook', label: 'فيسبوك', icon: <Facebook className="h-4 w-4" /> },
  { value: 'TikTok', label: 'تيك توك', icon: <span className="text-sm">TT</span> },
  { value: 'Link', label: 'رابط', icon: <LinkIcon className="h-4 w-4" /> },
];

export default function FooterManagement() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<FooterSetting | null>(null);
  const [hoursItem, setHoursItem] = useState<FooterSetting | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('contact');
  const [newItem, setNewItem] = useState({
    category: 'contact',
    key: '',
    label: '',
    value: '',
    value_en: '',
    icon: '',
    url: '',
    display_order: 0,
    is_active: true,
  });

  const { data: footerSettings, isLoading } = useQuery({
    queryKey: ['footer-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('footer_settings')
        .select('*')
        .order('category')
        .order('display_order');
      
      if (error) throw error;
      return data as FooterSetting[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (item: Partial<FooterSetting> & { id: string }) => {
      const { error } = await supabase
        .from('footer_settings')
        .update({
          label: item.label,
          value: item.value,
          value_en: item.value_en,
          icon: item.icon,
          url: item.url,
          display_order: item.display_order,
          is_active: item.is_active,
        })
        .eq('id', item.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-settings'] });
      toast.success('تم تحديث العنصر بنجاح');
      setEditingItem(null);
    },
    onError: () => {
      toast.error('حدث خطأ أثناء التحديث');
    },
  });

  const addMutation = useMutation({
    mutationFn: async (item: typeof newItem) => {
      const { error } = await supabase
        .from('footer_settings')
        .insert([item]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-settings'] });
      toast.success('تم إضافة العنصر بنجاح');
      setIsAddDialogOpen(false);
      setNewItem({
        category: 'contact',
        key: '',
        label: '',
        value: '',
        value_en: '',
        icon: '',
        url: '',
        display_order: 0,
        is_active: true,
      });
    },
    onError: () => {
      toast.error('حدث خطأ أثناء الإضافة');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('footer_settings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-settings'] });
      toast.success('تم حذف العنصر بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء الحذف');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('footer_settings')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footer-settings'] });
      toast.success('تم تحديث الحالة');
    },
  });

  const getIconComponent = (iconName: string | null) => {
    switch (iconName) {
      case 'Phone': return <Phone className="h-4 w-4" />;
      case 'Mail': return <Mail className="h-4 w-4" />;
      case 'Clock': return <Clock className="h-4 w-4" />;
      case 'Twitter': return <Twitter className="h-4 w-4" />;
      case 'Instagram': return <Instagram className="h-4 w-4" />;
      case 'Facebook': return <Facebook className="h-4 w-4" />;
      case 'TikTok': return <span className="text-xs font-bold">TT</span>;
      case 'Link': return <LinkIcon className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const groupedSettings = footerSettings?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FooterSetting[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة الـ Footer</h1>
          <p className="text-muted-foreground">تحكم في محتويات تذييل الصفحة</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة عنصر جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة عنصر جديد</DialogTitle>
              <DialogDescription>
                أضف عنصراً جديداً إلى تذييل الصفحة
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select
                  value={newItem.category}
                  onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المفتاح (بالإنجليزية)</Label>
                <Input
                  value={newItem.key}
                  onChange={(e) => setNewItem({ ...newItem, key: e.target.value })}
                  placeholder="مثال: whatsapp"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>التسمية</Label>
                <Input
                  value={newItem.label}
                  onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                  placeholder="مثال: واتساب"
                />
              </div>
              <div className="space-y-2">
                <Label>القيمة (عربي)</Label>
                <Input
                  value={newItem.value}
                  onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>القيمة (إنجليزي)</Label>
                <Input
                  value={newItem.value_en}
                  onChange={(e) => setNewItem({ ...newItem, value_en: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>الأيقونة</Label>
                <Select
                  value={newItem.icon}
                  onValueChange={(value) => setNewItem({ ...newItem, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر أيقونة" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          {opt.icon}
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الرابط (اختياري)</Label>
                <Input
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  placeholder="https://..."
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>ترتيب العرض</Label>
                <Input
                  type="number"
                  value={newItem.display_order}
                  onChange={(e) => setNewItem({ ...newItem, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={() => addMutation.mutate(newItem)}
                disabled={!newItem.key || !newItem.label || !newItem.value}
              >
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs by Category */}
       <Tabs defaultValue="quick_links" className="space-y-4">
         <TabsList className="grid w-full grid-cols-5">
          {Object.entries(categoryLabels).map(([key, { label, icon }]) => (
            <TabsTrigger key={key} value={key} className="gap-2">
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(categoryLabels).map(([categoryKey, { label, description }]) => (
          <TabsContent key={categoryKey} value={categoryKey}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {categoryLabels[categoryKey].icon}
                  {label}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupedSettings?.[categoryKey]?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                          {getIconComponent(item.icon)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.key}
                            </Badge>
                            {!item.is_active && (
                              <Badge variant="secondary" className="text-xs">
                                معطل
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{item.value}</p>
                          {item.url && (
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                              dir="ltr"
                            >
                              {item.url}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={(checked) => 
                            toggleActiveMutation.mutate({ id: item.id, is_active: checked })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (item.key === 'working_hours') {
                              setHoursItem(item);
                            } else {
                              setEditingItem(item);
                            }
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!groupedSettings?.[categoryKey] || groupedSettings[categoryKey].length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد عناصر في هذا التصنيف
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل العنصر</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>التسمية</Label>
                <Input
                  value={editingItem.label}
                  onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>القيمة (عربي)</Label>
                {editingItem.key === 'description' || editingItem.key === 'legal_notice' ? (
                  <Textarea
                    value={editingItem.value}
                    onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                    rows={3}
                  />
                ) : (
                  <Input
                    value={editingItem.value}
                    onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>القيمة (إنجليزي)</Label>
                {editingItem.key === 'description' || editingItem.key === 'legal_notice' ? (
                  <Textarea
                    value={editingItem.value_en || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, value_en: e.target.value })}
                    rows={3}
                    dir="ltr"
                  />
                ) : (
                  <Input
                    value={editingItem.value_en || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, value_en: e.target.value })}
                    dir="ltr"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>الأيقونة</Label>
                <Select
                  value={editingItem.icon || ''}
                  onValueChange={(value) => setEditingItem({ ...editingItem, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر أيقونة" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          {opt.icon}
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الرابط (اختياري)</Label>
                <Input
                  value={editingItem.url || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  placeholder="https://..."
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>ترتيب العرض</Label>
                <Input
                  type="number"
                  value={editingItem.display_order}
                  onChange={(e) => setEditingItem({ ...editingItem, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              إلغاء
            </Button>
            <Button 
              onClick={() => editingItem && updateMutation.mutate(editingItem)}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
