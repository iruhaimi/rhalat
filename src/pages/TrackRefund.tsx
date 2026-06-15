import { useState, useCallback } from 'react';
import SEO from '@/components/seo/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { filterArabicChars } from '@/lib/inputFilters';
import {
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Mail,
  FileText,
  Calendar,
  Phone,
  MessageSquare,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

type RefundRequest = {
  id: string;
  application_number: string;
  email: string;
  phone: string | null;
  reason: string;
  additional_details: string | null;
  status: string;
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; description: string }> = {
  pending: { 
    label: 'قيد الانتظار', 
    color: 'bg-amber-100 text-amber-800 border-amber-200', 
    icon: Clock,
    description: 'تم استلام طلبك وهو قيد المراجعة من قبل فريقنا'
  },
  processing: { 
    label: 'قيد المعالجة', 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    icon: RefreshCw,
    description: 'يتم حالياً معالجة طلب الاسترداد الخاص بك'
  },
  approved: { 
    label: 'تمت الموافقة', 
    color: 'bg-green-100 text-green-800 border-green-200', 
    icon: CheckCircle2,
    description: 'تمت الموافقة على طلب الاسترداد وسيتم تحويل المبلغ قريباً'
  },
  rejected: { 
    label: 'مرفوض', 
    color: 'bg-red-100 text-red-800 border-red-200', 
    icon: XCircle,
    description: 'للأسف تم رفض طلب الاسترداد. يرجى مراجعة الملاحظات للتفاصيل'
  },
};

export default function TrackRefund() {
  const { toast } = useToast();
  const [searchData, setSearchData] = useState({
    applicationNumber: '',
    email: '',
  });
  const [isSearching, setIsSearching] = useState(false);
  const [refundRequest, setRefundRequest] = useState<RefundRequest | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Handle email input - filter Arabic characters in real-time
  const handleEmailInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const filtered = filterArabicChars(input.value);
    if (filtered !== input.value) {
      input.value = filtered;
      setSearchData(prev => ({ ...prev, email: filtered }));
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchData.applicationNumber.trim() || !searchData.email.trim()) {
      toast({
        title: 'بيانات مطلوبة',
        description: 'يرجى إدخال رقم الطلب والبريد الإلكتروني',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    setNotFound(false);
    setRefundRequest(null);

    try {
      const { data, error } = await supabase
        .from('refund_requests')
        .select('*')
        .eq('application_number', searchData.applicationNumber.trim())
        .eq('email', searchData.email.trim().toLowerCase())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setRefundRequest(data);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error searching refund request:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const status = refundRequest ? statusConfig[refundRequest.status] || statusConfig.pending : null;
  const StatusIcon = status?.icon;

  return (
    <div className="flex min-h-screen flex-col">
      <SEO title="تتبع طلب الاسترداد — عطلات رحلاتكم" description="تابع حالة طلب الاسترداد الخاص بك في أي وقت." path="/track-refund" />
      <main className="flex-1">
        <div className="min-h-screen bg-canvas py-12">
          <div className="container max-w-2xl mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <RotateCcw className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">تتبع طلب الاسترداد</h1>
              <p className="text-muted-foreground">
                أدخل بياناتك للاطلاع على حالة طلب الاسترداد الخاص بك
              </p>
            </div>

            {/* Search Form */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="w-5 h-5 text-primary" />
                  البحث عن طلب الاسترداد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="applicationNumber">رقم الطلب الأصلي</Label>
                    <Input
                      id="applicationNumber"
                      placeholder="أدخل رقم طلب التأشيرة"
                      value={searchData.applicationNumber}
                      onChange={(e) => setSearchData(prev => ({ ...prev, applicationNumber: e.target.value }))}
                      className="text-left"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      placeholder="أدخل البريد الإلكتروني المستخدم في الطلب"
                      value={searchData.email}
                      onChange={(e) => setSearchData(prev => ({ ...prev, email: e.target.value }))}
                      onInput={handleEmailInput}
                      className="text-left"
                      dir="ltr"
                      style={{ textAlign: 'left' }}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSearching}>
                    {isSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        جاري البحث...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 ml-2" />
                        بحث
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Not Found Message */}
            {notFound && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="text-center py-6">
                    <XCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لم يتم العثور على الطلب</h3>
                    <p className="text-muted-foreground">
                      تأكد من صحة رقم الطلب والبريد الإلكتروني المدخل
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Refund Request Details */}
            {refundRequest && status && StatusIcon && (
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      تفاصيل طلب الاسترداد
                    </CardTitle>
                    <Badge className={`${status.color} border`}>
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Status Card */}
                  <div className={`p-4 rounded-lg border ${status.color.replace('text-', 'border-').replace('bg-', 'bg-opacity-50 bg-')}`}>
                    <div className="flex items-start gap-3">
                      <StatusIcon className="w-6 h-6 mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-1">{status.label}</h4>
                        <p className="text-sm opacity-80">{status.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Request Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm text-muted-foreground">رقم الطلب الأصلي</label>
                      <p className="font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        {refundRequest.application_number}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm text-muted-foreground">البريد الإلكتروني</label>
                      <p className="font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {refundRequest.email}
                      </p>
                    </div>
                    {refundRequest.phone && (
                      <div className="space-y-1">
                        <label className="text-sm text-muted-foreground">رقم الهاتف</label>
                        <p className="font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {refundRequest.phone}
                        </p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-sm text-muted-foreground">تاريخ التقديم</label>
                      <p className="font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(refundRequest.created_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                      </p>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">سبب الاسترداد</label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p>{refundRequest.reason}</p>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {refundRequest.additional_details && (
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">تفاصيل إضافية</label>
                      <div className="p-3 bg-muted rounded-lg">
                        <p>{refundRequest.additional_details}</p>
                      </div>
                    </div>
                  )}

                  {/* Admin Notes (if approved or rejected) */}
                  {refundRequest.admin_notes && (refundRequest.status === 'approved' || refundRequest.status === 'rejected') && (
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        ملاحظات الإدارة
                      </label>
                      <div className={`p-3 rounded-lg border ${
                        refundRequest.status === 'approved' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <p>{refundRequest.admin_notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Processed Date */}
                  {refundRequest.processed_at && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        تاريخ المعالجة: {format(new Date(refundRequest.processed_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Help Section */}
            <div className="mt-8 text-center">
              <p className="text-muted-foreground mb-2">
                هل لديك استفسارات حول طلب الاسترداد؟
              </p>
              <Button variant="link" asChild>
                <a href="/contact">تواصل معنا</a>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
