import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Flame, Eye, EyeOff, Tag, TrendingUp, Clock, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { AdminTable } from '@/components/admin/AdminTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import SARSymbol from '@/components/ui/SARSymbol';
import { cn } from '@/lib/utils';
import {
  useAllSpecialOffers,
  useCreateOffer,
  useUpdateOffer,
  useDeleteOffer,
  SpecialOffer,
} from '@/hooks/useSpecialOffers';

interface OfferFormData {
  title: string;
  description: string;
  discount_percentage: number;
  original_price: number;
  sale_price: number;
  country_name: string;
  flag_emoji: string;
  end_date: string;
  start_date: string;
  badge: string;
  is_hot: boolean;
  is_active: boolean;
}

const initialFormData: OfferFormData = {
  title: '',
  description: '',
  discount_percentage: 10,
  original_price: 0,
  sale_price: 0,
  country_name: '',
  flag_emoji: '🌍',
  end_date: '',
  start_date: new Date().toISOString().split('T')[0],
  badge: 'عرض خاص',
  is_hot: false,
  is_active: true,
};

function OfferForm({
  formData,
  setFormData,
  onSubmit,
  isLoading,
  submitLabel,
}: {
  formData: OfferFormData;
  setFormData: (data: OfferFormData) => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitLabel: string;
}) {
  const calculateSalePrice = (original: number, discount: number) => {
    return Math.round(original * (1 - discount / 100));
  };

  const handleOriginalPriceChange = (value: number) => {
    setFormData({
      ...formData,
      original_price: value,
      sale_price: calculateSalePrice(value, formData.discount_percentage),
    });
  };

  const handleDiscountChange = (value: number) => {
    setFormData({
      ...formData,
      discount_percentage: value,
      sale_price: calculateSalePrice(formData.original_price, value),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>عنوان العرض *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="تأشيرة دبي السياحية"
          />
        </div>
        <div className="space-y-2">
          <Label>اسم الدولة *</Label>
          <Input
            value={formData.country_name}
            onChange={(e) => setFormData({ ...formData, country_name: e.target.value })}
            placeholder="الإمارات"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>الوصف</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="وصف العرض..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>السعر الأصلي *</Label>
          <Input
            type="number"
            value={formData.original_price}
            onChange={(e) => handleOriginalPriceChange(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>نسبة الخصم % *</Label>
          <Input
            type="number"
            min={1}
            max={99}
            value={formData.discount_percentage}
            onChange={(e) => handleDiscountChange(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>السعر بعد الخصم</Label>
          <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted">
            <span className="font-bold text-primary">{formData.sale_price}</span>
            <SARSymbol size="sm" className="text-primary" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>تاريخ البداية *</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>تاريخ الانتهاء *</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>إيموجي العلم</Label>
          <Input
            value={formData.flag_emoji}
            onChange={(e) => setFormData({ ...formData, flag_emoji: e.target.value })}
            placeholder="🇦🇪"
          />
        </div>
        <div className="space-y-2">
          <Label>الشارة</Label>
          <Input
            value={formData.badge}
            onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
            placeholder="عرض خاص"
          />
        </div>
      </div>

      <div className="flex items-center gap-8 p-4 bg-muted/30 rounded-lg border">
        <label className="flex items-center gap-3 cursor-pointer group">
          <Checkbox
            checked={formData.is_hot}
            onCheckedChange={(checked) => setFormData({ ...formData, is_hot: checked === true })}
            className="h-5 w-5 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
          />
          <span className="flex items-center gap-2 text-sm font-medium group-hover:text-orange-600 transition-colors">
            <Flame className={cn("h-4 w-4", formData.is_hot ? "text-orange-500" : "text-muted-foreground")} />
            عرض حار
          </span>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer group">
          <Checkbox
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked === true })}
            className="h-5 w-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
          />
          <span className="flex items-center gap-2 text-sm font-medium group-hover:text-emerald-600 transition-colors">
            {formData.is_active ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            نشط
          </span>
        </label>
      </div>

      <Button onClick={onSubmit} disabled={isLoading} className="w-full">
        {isLoading ? 'جاري الحفظ...' : submitLabel}
      </Button>
    </div>
  );
}

export default function OffersManagement() {
  const { data: offers, isLoading } = useAllSpecialOffers();
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const deleteOffer = useDeleteOffer();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null);
  const [formData, setFormData] = useState<OfferFormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');

  const handleCreate = () => {
    if (!formData.title || !formData.country_name || !formData.end_date) {
      return;
    }
    createOffer.mutate(
      {
        ...formData,
        end_date: new Date(formData.end_date).toISOString(),
        start_date: new Date(formData.start_date).toISOString(),
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setFormData(initialFormData);
        },
      }
    );
  };

  const handleEdit = (offer: SpecialOffer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description || '',
      discount_percentage: offer.discount_percentage,
      original_price: offer.original_price,
      sale_price: offer.sale_price,
      country_name: offer.country_name,
      flag_emoji: offer.flag_emoji || '🌍',
      end_date: offer.end_date.split('T')[0],
      start_date: offer.start_date.split('T')[0],
      badge: offer.badge || 'عرض خاص',
      is_hot: offer.is_hot || false,
      is_active: offer.is_active ?? true,
    });
  };

  const handleUpdate = () => {
    if (!editingOffer) return;
    updateOffer.mutate(
      {
        id: editingOffer.id,
        ...formData,
        end_date: new Date(formData.end_date).toISOString(),
        start_date: new Date(formData.start_date).toISOString(),
      },
      {
        onSuccess: () => {
          setEditingOffer(null);
          setFormData(initialFormData);
        },
      }
    );
  };

  const handleToggleActive = (offer: SpecialOffer) => {
    updateOffer.mutate({
      id: offer.id,
      is_active: !offer.is_active,
    });
  };

  const isOfferExpired = (endDate: string) => new Date(endDate) < new Date();

  // Filter and search offers
  const filteredOffers = offers?.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.country_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const expired = isOfferExpired(offer.end_date);
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'active') return matchesSearch && offer.is_active && !expired;
    if (filterStatus === 'inactive') return matchesSearch && !offer.is_active && !expired;
    if (filterStatus === 'expired') return matchesSearch && expired;
    
    return matchesSearch;
  });

  // Stats
  const stats = {
    total: offers?.length || 0,
    active: offers?.filter(o => o.is_active && !isOfferExpired(o.end_date)).length || 0,
    inactive: offers?.filter(o => !o.is_active && !isOfferExpired(o.end_date)).length || 0,
    expired: offers?.filter(o => isOfferExpired(o.end_date)).length || 0,
    hot: offers?.filter(o => o.is_hot).length || 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Tag className="h-6 w-6 text-primary" />
              إدارة العروض الخاصة
            </h1>
            <p className="text-muted-foreground">إضافة وتعديل وحذف العروض والخصومات</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                إضافة عرض جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة عرض جديد</DialogTitle>
              </DialogHeader>
              <OfferForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreate}
                isLoading={createOffer.isPending}
                submitLabel="إضافة العرض"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setFilterStatus('all')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي العروض</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn("cursor-pointer hover:border-emerald-500/50 transition-colors", filterStatus === 'active' && "border-emerald-500")} onClick={() => setFilterStatus('active')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">نشط</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn("cursor-pointer hover:border-gray-500/50 transition-colors", filterStatus === 'inactive' && "border-gray-500")} onClick={() => setFilterStatus('inactive')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">غير نشط</p>
                  <p className="text-2xl font-bold text-gray-500">{stats.inactive}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gray-500/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn("cursor-pointer hover:border-red-500/50 transition-colors", filterStatus === 'expired' && "border-red-500")} onClick={() => setFilterStatus('expired')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">منتهي</p>
                  <p className="text-2xl font-bold text-red-500">{stats.expired}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:border-orange-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">عروض حارة</p>
                  <p className="text-2xl font-bold text-orange-500">{stats.hot}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Offers Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                العروض
                <Badge variant="secondary" className="text-base">{filteredOffers?.length || 0}</Badge>
              </CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالعنوان أو الدولة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9"
                  />
                </div>
                {filterStatus !== 'all' && (
                  <Button variant="ghost" size="sm" onClick={() => setFilterStatus('all')}>
                    <Filter className="h-4 w-4 ml-1" />
                    إلغاء الفلتر
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredOffers && filteredOffers.length > 0 ? (
              <AdminTable
                minWidth="1100px"
                columns={[
                  { width: '240px', label: 'العرض' },
                  { width: '180px', label: 'الدولة' },
                  { width: '100px', label: 'الخصم' },
                  { width: '180px', label: 'السعر' },
                  { width: '160px', label: 'تاريخ الانتهاء' },
                  { width: '120px', label: 'الحالة' },
                  { width: '160px', align: 'center', label: 'الإجراءات' },
                ]}
              >
                  <TableBody>
                    {filteredOffers.map((offer) => {
                      const expired = isOfferExpired(offer.end_date);
                      return (
                        <TableRow key={offer.id} className={cn("group h-[64px]", expired && "bg-red-50/50")}>
                          <TableCell className="align-middle">
                            <div className="flex items-center gap-2">
                              {offer.is_hot && (
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-orange-100 flex-shrink-0">
                                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                                </span>
                              )}
                              <span className="font-medium truncate" title={offer.title}>{offer.title}</span>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xl flex-shrink-0">{offer.flag_emoji}</span>
                              <span className="truncate" title={offer.country_name}>{offer.country_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold">
                              {offer.discount_percentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex items-center gap-2 tabular-nums">
                              <span className="font-bold text-primary text-lg">{offer.sale_price}</span>
                              <SARSymbol size="xs" className="text-primary" />
                              <span className="text-muted-foreground line-through text-sm">
                                {offer.original_price}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle whitespace-nowrap">
                            <div className={cn(
                              "flex items-center gap-1.5",
                              expired ? "text-destructive" : "text-foreground"
                            )}>
                              <Clock className={cn("h-3.5 w-3.5", expired && "text-destructive")} />
                              {format(new Date(offer.end_date), 'dd MMM yyyy', { locale: ar })}
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            {expired ? (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                منتهي
                              </Badge>
                            ) : offer.is_active ? (
                              <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                نشط
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                غير نشط
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={offer.is_active ? "ghost" : "outline"}
                                    size="icon"
                                    onClick={() => handleToggleActive(offer)}
                                    className={cn(
                                      "h-8 w-8 transition-all",
                                      offer.is_active 
                                        ? "hover:bg-gray-100 text-gray-500" 
                                        : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                    )}
                                    disabled={expired}
                                  >
                                    {offer.is_active ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {expired ? 'العرض منتهي' : offer.is_active ? 'إخفاء العرض' : 'تفعيل العرض'}
                                </TooltipContent>
                              </Tooltip>
                              
                              <Dialog
                                open={editingOffer?.id === offer.id}
                                onOpenChange={(open) => !open && setEditingOffer(null)}
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(offer)}
                                        className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>تعديل العرض</TooltipContent>
                                </Tooltip>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>تعديل العرض</DialogTitle>
                                  </DialogHeader>
                                  <OfferForm
                                    formData={formData}
                                    setFormData={setFormData}
                                    onSubmit={handleUpdate}
                                    isLoading={updateOffer.isPending}
                                    submitLabel="حفظ التغييرات"
                                  />
                                </DialogContent>
                              </Dialog>
                              
                              <AlertDialog>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>حذف العرض</TooltipContent>
                                </Tooltip>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>حذف العرض</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      هل أنت متأكد من حذف عرض "{offer.title}"؟ لا يمكن التراجع عن هذا الإجراء.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteOffer.mutate(offer.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      حذف
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
              </AdminTable>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium">لا توجد عروض {filterStatus !== 'all' && 'تطابق البحث'}</p>
                <p className="text-sm mb-4">ابدأ بإضافة عروض جديدة لجذب العملاء</p>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة أول عرض
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
