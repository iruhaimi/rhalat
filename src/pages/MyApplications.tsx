import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import NoIndex from '@/components/seo/NoIndex';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Clock, 
  Eye, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Plane,
  Edit3
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import type { ApplicationStatus } from '@/types/database';

interface ApplicationWithVisa {
  id: string;
  status: ApplicationStatus;
  travel_date: string | null;
  created_at: string;
  submitted_at: string | null;
  visa_type: {
    id: string;
    name: string;
    processing_days: number;
    country: {
      id: string;
      name: string;
      code: string;
      flag_url: string | null;
    };
  };
}

// Status progress mapping
const STATUS_PROGRESS: Record<ApplicationStatus, number> = {
  draft: 0,
  pending_payment: 10,
  submitted: 20,
  under_review: 40,
  documents_required: 50,
  processing: 70,
  approved: 100,
  rejected: 100,
  cancelled: 0,
  whatsapp_pending: 15,
};

const MyApplications = () => {
  const { user, profile } = useAuth();
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  
  const [applications, setApplications] = useState<ApplicationWithVisa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const labels = {
    pageTitle: isRTL ? 'طلباتي' : 'My Applications',
    noApplications: isRTL ? 'لا توجد طلبات حتى الآن' : 'No applications yet',
    startApplication: isRTL ? 'ابدأ طلب جديد' : 'Start New Application',
    viewDetails: isRTL ? 'عرض التفاصيل' : 'View Details',
    applicationId: isRTL ? 'رقم الطلب' : 'Application ID',
    travelDate: isRTL ? 'تاريخ السفر' : 'Travel Date',
    submittedAt: isRTL ? 'تاريخ التقديم' : 'Submitted At',
    createdAt: isRTL ? 'تاريخ الإنشاء' : 'Created At',
    status: isRTL ? 'الحالة' : 'Status',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    error: isRTL ? 'حدث خطأ أثناء تحميل الطلبات' : 'Error loading applications',
    retry: isRTL ? 'إعادة المحاولة' : 'Retry',
    notScheduled: isRTL ? 'غير محدد' : 'Not scheduled',
  };

  const statusLabels: Record<ApplicationStatus, { ar: string; en: string }> = {
    draft: { ar: 'مسودة', en: 'Draft' },
    pending_payment: { ar: 'في انتظار الدفع', en: 'Pending Payment' },
    submitted: { ar: 'تم التقديم', en: 'Submitted' },
    under_review: { ar: 'قيد المراجعة', en: 'Under Review' },
    documents_required: { ar: 'مستندات مطلوبة', en: 'Documents Required' },
    processing: { ar: 'قيد المعالجة', en: 'Processing' },
    approved: { ar: 'تمت الموافقة', en: 'Approved' },
    rejected: { ar: 'مرفوض', en: 'Rejected' },
    cancelled: { ar: 'ملغى', en: 'Cancelled' },
    whatsapp_pending: { ar: 'بانتظار واتساب', en: 'WhatsApp Pending' },
  };

  const getStatusVariant = (status: ApplicationStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
      case 'cancelled':
        return 'destructive';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'processing':
      case 'under_review':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'documents_required':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const fetchApplications = async () => {
    if (!profile) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          travel_date,
          created_at,
          submitted_at,
          visa_type:visa_types (
            id,
            name,
            processing_days,
            country:countries (
              id,
              name,
              code,
              flag_url
            )
          )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setApplications(data as unknown as ApplicationWithVisa[]);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(isRTL ? 'حدث خطأ أثناء تحميل الطلبات' : 'Error loading applications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchApplications();
    }
  }, [profile]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return labels.notScheduled;
    return format(new Date(dateString), 'dd MMM yyyy', { 
      locale: isRTL ? ar : enUS 
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto py-16 px-4 text-center" dir={direction}>
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-4">
          {isRTL ? 'يرجى تسجيل الدخول' : 'Please Sign In'}
        </h1>
        <p className="text-muted-foreground mb-6">
          {isRTL ? 'يجب تسجيل الدخول لعرض طلباتك' : 'You need to sign in to view your applications'}
        </p>
        <Button asChild>
          <Link to="/auth">{isRTL ? 'تسجيل الدخول' : 'Sign In'}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas" dir={direction}>
      <NoIndex />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy/95 to-brand text-white">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, hsl(var(--brand)/0.4), transparent 50%)' }} />
        <div className="container mx-auto px-4 py-12 relative">
          <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h1 className="font-heading-ar text-3xl md:text-5xl font-black text-white">{labels.pageTitle}</h1>
            </div>
            <Button asChild className="rounded-2xl bg-white text-navy hover:bg-white/90 h-12 px-6">
              <Link to="/destinations">
                <Plane className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {labels.startApplication}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-8 pb-16 relative">
        <div className="max-w-4xl mx-auto">

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="border-destructive">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchApplications} variant="outline">
                <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {labels.retry}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && applications.length === 0 && (
          <Card className="rounded-3xl border-border shadow-xl shadow-navy/5">
            <CardContent className="p-12 text-center">
              <div className="inline-flex p-4 rounded-3xl bg-navy/5 mb-4">
                <FileText className="h-12 w-12 text-navy/60" />
              </div>
              <h2 className="font-heading-ar text-2xl font-black text-navy mb-2">{labels.noApplications}</h2>
              <p className="text-muted-foreground mb-6">
                {isRTL 
                  ? 'ابدأ بتقديم طلب تأشيرة جديد الآن'
                  : 'Start by submitting a new visa application'}
              </p>
              <Button asChild size="lg" className="rounded-2xl bg-navy hover:bg-navy/90 text-white h-12 px-8">
                <Link to="/destinations">
                  <Plane className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {labels.startApplication}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Applications List */}
        {!isLoading && !error && applications.length > 0 && (
          <div className="space-y-4">
            {applications.map((app) => {
              const progress = STATUS_PROGRESS[app.status];
              const processingDays = app.visa_type?.processing_days || 7;
              const daysElapsed = app.submitted_at 
                ? differenceInDays(new Date(), new Date(app.submitted_at))
                : 0;
              const daysRemaining = Math.max(0, processingDays - daysElapsed);
              const isActive = !['approved', 'rejected', 'cancelled', 'draft'].includes(app.status);
              const isDraft = app.status === 'draft';
              
              return (
                <Card key={app.id} className="rounded-3xl border-border shadow-lg shadow-navy/5 hover:shadow-2xl hover:shadow-navy/10 hover:-translate-y-1 transition-all overflow-hidden">
                  {/* Progress indicator bar at top */}
                  {isActive && (
                    <div className="h-1.5 bg-muted">
                      <div 
                        className="h-full bg-gradient-to-r from-navy to-brand transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                  
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Country Flag & Info */}
                      <div className="flex items-center gap-4 flex-1">
                        {app.visa_type?.country?.flag_url && (
                          <img
                            src={app.visa_type.country.flag_url}
                            alt={app.visa_type.country.name}
                            className="h-14 w-20 object-cover rounded-2xl shadow-md saturate-150 contrast-110"
                          />
                        )}
                        <div>
                          <h3 className="font-heading-ar text-xl font-black text-navy">
                            {app.visa_type?.country?.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {app.visa_type?.name}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {daysRemaining} {isRTL ? 'يوم' : 'days'}
                          </Badge>
                        )}
                        <Badge 
                          variant={getStatusVariant(app.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(app.status)}
                          {statusLabels[app.status][isRTL ? 'ar' : 'en']}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Bar for active applications */}
                    {isActive && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{isRTL ? 'التقدم' : 'Progress'}</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {/* Details Row */}
                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{app.id.slice(0, 8)}...</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {isRTL ? 'السفر: ' : 'Travel: '}
                          {formatDate(app.travel_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {isRTL ? 'تم الإنشاء: ' : 'Created: '}
                          {formatDate(app.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex justify-end gap-2">
                      {isDraft && (
                        <Button asChild variant="default" size="sm" className="rounded-xl bg-navy hover:bg-navy/90 text-white">
                          <Link to={`/apply?draft=${app.id}`}>
                            <Edit3 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {isRTL ? 'استكمال الطلب' : 'Continue'}
                          </Link>
                        </Button>
                      )}
                      <Button asChild variant="outline" size="sm" className="rounded-xl border-border hover:border-navy/30">
                        <Link to={`/application?id=${app.id}`}>
                          <Eye className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                          {labels.viewDetails}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default MyApplications;
