import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '@/types/database';

interface ProcessingProgressBarProps {
  status: ApplicationStatus;
  processingDays: number;
  submittedAt: string | null;
  className?: string;
}

// Status progression order for calculating progress
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

export default function ProcessingProgressBar({ 
  status, 
  processingDays, 
  submittedAt,
  className 
}: ProcessingProgressBarProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [estimatedDaysLeft, setEstimatedDaysLeft] = useState<number | null>(null);
  
  // Calculate progress percentage based on status
  const progressPercentage = STATUS_PROGRESS[status] || 0;
  
  // Calculate estimated days remaining
  useEffect(() => {
    if (submittedAt && processingDays && status !== 'approved' && status !== 'rejected' && status !== 'cancelled') {
      const submitted = new Date(submittedAt);
      const now = new Date();
      const daysPassed = Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
      const remaining = Math.max(0, processingDays - daysPassed);
      setEstimatedDaysLeft(remaining);
    } else {
      setEstimatedDaysLeft(null);
    }
  }, [submittedAt, processingDays, status]);
  
  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercentage);
    }, 300);
    return () => clearTimeout(timer);
  }, [progressPercentage]);
  
  const getStatusInfo = () => {
    switch (status) {
      case 'draft':
        return {
          label: isRTL ? 'مسودة' : 'Draft',
          description: isRTL ? 'لم يتم تقديم الطلب بعد' : 'Application not submitted yet',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted'
        };
      case 'pending_payment':
        return {
          label: isRTL ? 'بانتظار الدفع' : 'Pending Payment',
          description: isRTL ? 'يرجى إكمال عملية الدفع' : 'Please complete the payment',
          color: 'text-amber-600',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30'
        };
      case 'submitted':
        return {
          label: isRTL ? 'تم التقديم' : 'Submitted',
          description: isRTL ? 'تم استلام طلبك وسيتم مراجعته' : 'Your application has been received',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30'
        };
      case 'under_review':
        return {
          label: isRTL ? 'قيد المراجعة' : 'Under Review',
          description: isRTL ? 'فريقنا يراجع طلبك' : 'Our team is reviewing your application',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30'
        };
      case 'documents_required':
        return {
          label: isRTL ? 'مستندات مطلوبة' : 'Documents Required',
          description: isRTL ? 'يرجى تحميل المستندات المطلوبة' : 'Please upload required documents',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100 dark:bg-orange-900/30'
        };
      case 'processing':
        return {
          label: isRTL ? 'قيد المعالجة' : 'Processing',
          description: isRTL ? 'طلبك قيد المعالجة' : 'Your application is being processed',
          color: 'text-cyan-600',
          bgColor: 'bg-cyan-100 dark:bg-cyan-900/30'
        };
      case 'approved':
        return {
          label: isRTL ? 'تمت الموافقة' : 'Approved',
          description: isRTL ? 'تهانينا! تمت الموافقة على طلبك' : 'Congratulations! Your application is approved',
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/30'
        };
      case 'rejected':
        return {
          label: isRTL ? 'مرفوض' : 'Rejected',
          description: isRTL ? 'للأسف تم رفض طلبك' : 'Unfortunately your application was rejected',
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900/30'
        };
      case 'cancelled':
        return {
          label: isRTL ? 'ملغي' : 'Cancelled',
          description: isRTL ? 'تم إلغاء هذا الطلب' : 'This application has been cancelled',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30'
        };
      default:
        return {
          label: status,
          description: '',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted'
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  const isCompleted = status === 'approved';
  const isFailed = status === 'rejected' || status === 'cancelled';
  const isActive = !isCompleted && !isFailed && status !== 'draft';
  
  return (
    <div className={cn("bg-card border rounded-xl p-4 sm:p-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", statusInfo.bgColor)}>
            {isCompleted ? (
              <CheckCircle2 className={cn("w-5 h-5", statusInfo.color)} />
            ) : isActive ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className={cn("w-5 h-5", statusInfo.color)} />
              </motion.div>
            ) : (
              <Clock className={cn("w-5 h-5", statusInfo.color)} />
            )}
          </div>
          <div>
            <h4 className={cn("font-bold", statusInfo.color)}>{statusInfo.label}</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">{statusInfo.description}</p>
          </div>
        </div>
        
        {/* Days Remaining Badge */}
        {estimatedDaysLeft !== null && isActive && (
          <Badge variant="secondary" className="gap-1 shrink-0">
            <Clock className="w-3 h-3" />
            {estimatedDaysLeft === 0 
              ? (isRTL ? 'اليوم' : 'Today')
              : (isRTL 
                  ? `${estimatedDaysLeft} ${estimatedDaysLeft === 1 ? 'يوم' : 'أيام'} متبقية`
                  : `${estimatedDaysLeft} day${estimatedDaysLeft > 1 ? 's' : ''} left`
                )
            }
          </Badge>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Progress 
            value={animatedProgress} 
            className={cn(
              "h-3 transition-all duration-1000",
              isFailed && "[&>div]:bg-red-500"
            )}
          />
          
          {/* Animated pulse on active progress */}
          {isActive && animatedProgress < 100 && (
            <motion.div
              className="absolute top-0 h-3 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
              style={{ left: `${animatedProgress - 4}%` }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
        
        {/* Progress Labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{isRTL ? 'تم التقديم' : 'Submitted'}</span>
          <span className="font-medium">{animatedProgress}%</span>
          <span>{isRTL ? 'مكتمل' : 'Complete'}</span>
        </div>
      </div>
      
      {/* Processing Time Info */}
      {processingDays > 0 && isActive && (
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {isRTL ? 'وقت المعالجة المتوقع' : 'Expected processing time'}
          </span>
          <span className="font-medium">
            {processingDays} {isRTL ? 'أيام عمل' : 'business days'}
          </span>
        </div>
      )}
    </div>
  );
}
