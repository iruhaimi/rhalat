import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  FileText, 
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const documentTypes = [
  { id: 'passport', label: { ar: 'جواز السفر', en: 'Passport' } },
  { id: 'photo', label: { ar: 'الصورة الشخصية', en: 'Personal Photo' } },
  { id: 'bank_statement', label: { ar: 'كشف الحساب البنكي', en: 'Bank Statement' } },
  { id: 'hotel_booking', label: { ar: 'حجز الفندق', en: 'Hotel Booking' } },
  { id: 'flight_booking', label: { ar: 'حجز الطيران', en: 'Flight Booking' } },
  { id: 'travel_insurance', label: { ar: 'تأمين السفر', en: 'Travel Insurance' } },
];

interface FileUploadState {
  file: File | null;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function Step4Documents() {
  const { t, direction, language } = useLanguage();
  const { applicationData, updateApplicationData, goToNextStep, goToPreviousStep } = useApplication();
  
  const [uploads, setUploads] = useState<Record<string, FileUploadState>>({});
  
  const ArrowNextIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const ArrowPrevIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  const handleFileSelect = useCallback((docType: string, file: File) => {
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (!allowedTypes.includes(file.type)) {
      setUploads(prev => ({
        ...prev,
        [docType]: {
          file: null,
          progress: 0,
          status: 'error',
          error: direction === 'rtl' ? 'نوع الملف غير مدعوم' : 'File type not supported',
        },
      }));
      return;
    }
    
    if (file.size > maxSize) {
      setUploads(prev => ({
        ...prev,
        [docType]: {
          file: null,
          progress: 0,
          status: 'error',
          error: direction === 'rtl' ? 'حجم الملف كبير جداً' : 'File size too large',
        },
      }));
      return;
    }

    // Simulate upload
    setUploads(prev => ({
      ...prev,
      [docType]: { file, progress: 0, status: 'uploading' },
    }));

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploads(prev => ({
          ...prev,
          [docType]: { file, progress: 100, status: 'success' },
        }));
        
        // Update application data
        const newDoc = {
          type: docType,
          fileName: file.name,
          fileSize: file.size,
          uploaded: true,
        };
        updateApplicationData({
          uploadedDocuments: [
            ...applicationData.uploadedDocuments.filter(d => d.type !== docType),
            newDoc,
          ],
        });
      } else {
        setUploads(prev => ({
          ...prev,
          [docType]: { ...prev[docType], progress },
        }));
      }
    }, 200);
  }, [applicationData.uploadedDocuments, direction, updateApplicationData]);

  const handleRemove = (docType: string) => {
    setUploads(prev => {
      const updated = { ...prev };
      delete updated[docType];
      return updated;
    });
    updateApplicationData({
      uploadedDocuments: applicationData.uploadedDocuments.filter(d => d.type !== docType),
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadedCount = applicationData.uploadedDocuments.filter(d => d.uploaded).length;
  const canProceed = true; // Documents are optional - user may continue via WhatsApp

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold">{t('wizard.step4')}</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          {direction === 'rtl' 
            ? 'رفع المستندات اختياري - يمكنك إكمال الطلب وإرسالها لاحقاً عبر واتساب' 
            : 'Document upload is optional - you can continue and send them later via WhatsApp'}
        </p>
      </div>

      {/* Upload Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4 bg-muted/30 rounded-xl">
        <span className="font-medium text-sm sm:text-base">
          {direction === 'rtl' 
            ? `${uploadedCount} مستند تم رفعه`
            : `${uploadedCount} document${uploadedCount !== 1 ? 's' : ''} uploaded`
          }
        </span>
        <Badge variant="secondary" className="w-fit">
          {direction === 'rtl' ? 'اختياري' : 'Optional'}
        </Badge>
      </div>

      {/* File Upload Areas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {documentTypes.map((docType) => {
          const upload = uploads[docType.id];
          const existingDoc = applicationData.uploadedDocuments.find(d => d.type === docType.id);
          const isUploaded = upload?.status === 'success' || existingDoc?.uploaded;
          
          return (
            <div
              key={docType.id}
              className={cn(
                "relative p-4 rounded-lg border-2 border-dashed transition-colors",
                isUploaded && "border-green-500 bg-green-50 dark:bg-green-950/20",
                upload?.status === 'error' && "border-destructive bg-destructive/5",
                !isUploaded && !upload?.status && "border-muted-foreground/30 hover:border-primary/50"
              )}
            >
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(docType.id, file);
                }}
                disabled={upload?.status === 'uploading'}
              />
              
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  isUploaded ? "bg-green-100 text-green-600" : "bg-muted"
                )}>
                  {upload?.status === 'uploading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isUploaded ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : upload?.status === 'error' ? (
                    <XCircle className="w-5 h-5 text-destructive" />
                  ) : (
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium">
                    {docType.label[language]}
                  </div>
                  
                  {upload?.status === 'uploading' && (
                    <div className="mt-2">
                      <Progress value={upload.progress} className="h-1" />
                      <span className="text-xs text-muted-foreground">
                        {Math.round(upload.progress)}%
                      </span>
                    </div>
                  )}
                  
                  {isUploaded && (upload?.file || existingDoc) && (
                    <div className="flex items-center gap-2 mt-1">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">
                        {upload?.file?.name || existingDoc?.fileName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({formatFileSize(upload?.file?.size || existingDoc?.fileSize || 0)})
                      </span>
                    </div>
                  )}
                  
                  {upload?.status === 'error' && (
                    <div className="text-xs text-destructive mt-1">
                      {upload.error}
                    </div>
                  )}
                  
                  {!isUploaded && !upload?.status && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {t('documents.formats')} • {t('documents.maxSize')}
                    </div>
                  )}
                </div>
                
                {isUploaded && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 z-20 relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(docType.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
        <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
          {direction === 'rtl' ? 'ملاحظات هامة' : 'Important Notes'}
        </h4>
        <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
          <li>
            {direction === 'rtl' 
              ? 'الملفات المقبولة: PDF, JPG, PNG'
              : 'Accepted files: PDF, JPG, PNG'}
          </li>
          <li>
            {direction === 'rtl' 
              ? 'الحد الأقصى لحجم الملف: 10 ميجابايت'
              : 'Maximum file size: 10MB'}
          </li>
          <li>
            {direction === 'rtl' 
              ? 'تأكد من وضوح المستندات وأن تكون مقروءة'
              : 'Make sure documents are clear and readable'}
          </li>
        </ul>
      </div>

      {/* Navigation Buttons - Sticky on mobile */}
      <div className="flex gap-3 sm:gap-4 pt-4 sm:pt-6 sticky bottom-0 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent sm:backdrop-blur-none border-t sm:border-0 mt-4 sm:mt-0">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1 h-12 gap-2 text-sm sm:text-base"
          onClick={goToPreviousStep}
        >
          <ArrowPrevIcon className="w-4 h-4" />
          <span className="hidden xs:inline">{t('wizard.previous')}</span>
          <span className="xs:hidden">{direction === 'rtl' ? 'السابق' : 'Back'}</span>
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1 h-12 gap-2 text-sm sm:text-base"
          onClick={goToNextStep}
          disabled={!canProceed}
        >
          <span className="hidden xs:inline">{t('wizard.next')}</span>
          <span className="xs:hidden">{direction === 'rtl' ? 'التالي' : 'Next'}</span>
          <ArrowNextIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
