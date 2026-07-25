import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { useAuth } from '@/contexts/AuthContext';
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
  Trash2,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisaRequirement {
  id: string;
  code: string | null;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  icon: string | null;
  applies_to: string;
  is_required: boolean;
  requires_upload: boolean;
  display_order: number;
}

interface ExpandedRequirement {
  slotId: string; // unique per traveler instance
  reqId: string;
  name: string;
  description: string;
  isRequired: boolean;
  requiresUpload: boolean;
  travelerLabel: string;
}

interface FileUploadState {
  file: File | null;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function Step4Documents() {
  const { t, direction, language } = useLanguage();
  const {
    applicationData,
    updateApplicationData,
    goToNextStep,
    goToPreviousStep,
    draftId,
    setDraftId,
  } = useApplication();
  const { user } = useAuth();
  
  const [uploads, setUploads] = useState<Record<string, FileUploadState>>({});
  
  const ArrowNextIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const ArrowPrevIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  // Fetch dynamic requirements for this visa type from admin-managed table
  const { data: dbRequirements, isLoading: reqsLoading } = useQuery({
    queryKey: ['visa-requirements', applicationData.visaTypeId],
    queryFn: async () => {
      if (!applicationData.visaTypeId) return [] as VisaRequirement[];
      const { data, error } = await supabase
        .from('visa_requirements')
        .select('*')
        .eq('visa_type_id', applicationData.visaTypeId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []) as VisaRequirement[];
    },
    enabled: !!applicationData.visaTypeId,
  });

  // Expand requirements per matching traveler (e.g. bank_statement × 2 adults = 2 slots)
  const expandedRequirements: ExpandedRequirement[] = (() => {
    if (!dbRequirements) return [];
    const { travelers } = applicationData;
    const result: ExpandedRequirement[] = [];
    for (const req of dbRequirements) {
      const name = language === 'ar' ? req.name_ar : req.name_en;
      const description = (language === 'ar' ? req.description_ar : req.description_en) || '';
      const pushSlot = (category: 'adult' | 'child' | 'infant', index: number) => {
        const labels = {
          ar: { adult: 'بالغ', child: 'طفل', infant: 'رضيع' },
          en: { adult: 'Adult', child: 'Child', infant: 'Infant' },
        };
        const travelerLabel = `${labels[language][category]} ${index}`;
        result.push({
          slotId: `${req.id}_${category}_${index}`,
          reqId: req.id,
          name,
          description,
          isRequired: req.is_required,
          requiresUpload: req.requires_upload,
          travelerLabel,
        });
      };
      if (req.applies_to === 'all') {
        for (let i = 1; i <= travelers.adults; i++) pushSlot('adult', i);
        for (let i = 1; i <= travelers.children; i++) pushSlot('child', i);
        for (let i = 1; i <= travelers.infants; i++) pushSlot('infant', i);
      } else if (req.applies_to === 'adult') {
        for (let i = 1; i <= travelers.adults; i++) pushSlot('adult', i);
      } else if (req.applies_to === 'child') {
        for (let i = 1; i <= travelers.children; i++) pushSlot('child', i);
      } else if (req.applies_to === 'infant') {
        for (let i = 1; i <= travelers.infants; i++) pushSlot('infant', i);
      }
    }
    return result;
  })();

  // Magic-byte sniffing — reject files whose header does not match the claimed MIME.
  const sniffMatchesMime = async (file: File): Promise<boolean> => {
    try {
      const buf = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      const isPDF = buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46; // %PDF
      const isJPG = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
      const isPNG = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
      if (file.type === 'application/pdf') return isPDF;
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') return isJPG;
      if (file.type === 'image/png') return isPNG;
      return false;
    } catch {
      return false;
    }
  };

  // Ensure a draft application exists so uploads can be attached to it.
  const ensureDraftId = async (): Promise<string | null> => {
    if (draftId) return draftId;
    if (!applicationData.visaTypeId) return null;
    const { data: newId, error } = await supabase.rpc('create_application_draft', {
      p_visa_type_id: applicationData.visaTypeId,
      p_travel_date: applicationData.travelDate
        ? applicationData.travelDate.toISOString().split('T')[0]
        : null,
      p_draft_data: {},
    });
    if (error || !newId) return null;
    setDraftId(newId as string);
    return newId as string;
  };

  const handleFileSelect = useCallback(async (slot: ExpandedRequirement, file: File) => {
    const docType = slot.slotId;
    const maxSize = 10 * 1024 * 1024; // 10MB
    const extByMime: Record<string, string> = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
    };

    if (!extByMime[file.type]) {
      setUploads(prev => ({
        ...prev,
        [docType]: { file: null, progress: 0, status: 'error',
          error: direction === 'rtl' ? 'نوع الملف غير مدعوم' : 'File type not supported' },
      }));
      return;
    }
    if (file.size > maxSize) {
      setUploads(prev => ({
        ...prev,
        [docType]: { file: null, progress: 0, status: 'error',
          error: direction === 'rtl' ? 'حجم الملف كبير جداً (الحد 10MB)' : 'File too large (max 10MB)' },
      }));
      return;
    }
    if (!(await sniffMatchesMime(file))) {
      setUploads(prev => ({
        ...prev,
        [docType]: { file: null, progress: 0, status: 'error',
          error: direction === 'rtl' ? 'محتوى الملف لا يطابق امتداده' : 'File content does not match its type' },
      }));
      return;
    }
    if (!user) {
      setUploads(prev => ({
        ...prev,
        [docType]: { file: null, progress: 0, status: 'error',
          error: direction === 'rtl' ? 'يجب تسجيل الدخول لرفع المستندات' : 'Sign in required to upload' },
      }));
      return;
    }

    setUploads(prev => ({ ...prev, [docType]: { file, progress: 10, status: 'uploading' } }));

    try {
      const appId = await ensureDraftId();
      if (!appId) throw new Error('draft_unavailable');

      const ext = extByMime[file.type];
      const uuid = (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      // RLS on `documents` requires first path segment == auth.uid().
      const path = `${user.id}/${appId}/${slot.reqId}/${docType}-${uuid}.${ext}`;

      setUploads(prev => ({ ...prev, [docType]: { file, progress: 40, status: 'uploading' } }));

      const { error: upErr } = await supabase.storage
        .from('documents')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      setUploads(prev => ({ ...prev, [docType]: { file, progress: 80, status: 'uploading' } }));

      // Record in application_documents. document_type = requirement UUID
      // so submit_application's server-side completeness check can match it.
      const { error: insErr } = await supabase.from('application_documents').insert({
        application_id: appId,
        document_type: slot.reqId,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
        status: 'uploaded',
      });
      if (insErr) throw insErr;

      setUploads(prev => ({ ...prev, [docType]: { file, progress: 100, status: 'success' } }));

      updateApplicationData({
        uploadedDocuments: [
          ...applicationData.uploadedDocuments.filter(d => d.type !== docType),
          { type: docType, fileName: file.name, fileSize: file.size, uploaded: true },
        ],
      });
    } catch (e: any) {
      console.error('Upload failed:', e);
      setUploads(prev => ({
        ...prev,
        [docType]: { file: null, progress: 0, status: 'error',
          error: direction === 'rtl' ? 'فشل رفع الملف، حاول مجدداً' : 'Upload failed, please try again' },
      }));
    }
  }, [applicationData.uploadedDocuments, applicationData.visaTypeId, applicationData.travelDate, direction, updateApplicationData, user, draftId, setDraftId]);

  const handleRemove = async (slot: ExpandedRequirement) => {
    const docType = slot.slotId;
    try {
      if (draftId) {
        // Find the matching document row(s) for this requirement + application
        // and prefer the most recent one uploaded for this slot's file name if present.
        const { data: rows } = await supabase
          .from('application_documents')
          .select('id, file_path, file_name')
          .eq('application_id', draftId)
          .eq('document_type', slot.reqId)
          .order('created_at', { ascending: false });
        const localName = uploads[docType]?.file?.name
          ?? applicationData.uploadedDocuments.find(d => d.type === docType)?.fileName;
        const target = rows?.find(r => r.file_name === localName) ?? rows?.[0];
        if (target) {
          await supabase.storage.from('documents').remove([target.file_path]);
          await supabase.from('application_documents').delete().eq('id', target.id);
        }
      }
    } catch (e) {
      console.error('Remove failed:', e);
    }
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
  const totalSlots = expandedRequirements.length;
  const requiredCount = expandedRequirements.filter(r => r.isRequired).length;
  const canProceed = true; // Documents are optional — user may complete later via WhatsApp

  return (
    <div className="space-y-3">
      <div className="text-center mb-2">
        <h2 className="text-lg sm:text-xl font-bold">{t('wizard.step3')}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {direction === 'rtl' 
            ? 'هذه المتطلبات الخاصة بسفارتك. ارفع ما يتوفر لديك الآن أو أكمل لاحقاً عبر واتساب.' 
            : 'These are your embassy\'s requirements. Upload what you have now or complete later via WhatsApp.'}
        </p>
      </div>

      {/* Upload Progress + Required Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-muted/30 rounded-xl">
        <span className="font-medium text-xs sm:text-sm">
          {direction === 'rtl' 
            ? `${uploadedCount} من ${totalSlots} مستند تم رفعه`
            : `${uploadedCount} of ${totalSlots} documents uploaded`
          }
        </span>
        <div className="flex items-center gap-2">
          {requiredCount > 0 && (
            <Badge variant="destructive" className="w-fit text-xs gap-1">
              <AlertTriangle className="w-3 h-3" />
              {direction === 'rtl' ? `${requiredCount} إلزامي` : `${requiredCount} required`}
            </Badge>
          )}
          <Badge variant="secondary" className="w-fit text-xs">
            {direction === 'rtl' ? 'الرفع اختياري الآن' : 'Upload optional now'}
          </Badge>
        </div>
      </div>

      {reqsLoading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {direction === 'rtl' ? 'جاري تحميل متطلبات السفارة...' : 'Loading embassy requirements...'}
        </div>
      )}

      {!reqsLoading && expandedRequirements.length === 0 && (
        <div className="p-4 text-center text-sm text-muted-foreground bg-muted/20 rounded-xl">
          {direction === 'rtl'
            ? 'لم يتم تحديد متطلبات لهذه السفارة بعد. يمكنك المتابعة وسيتواصل معك فريقنا.'
            : 'No requirements configured for this embassy yet. You can continue and our team will reach out.'}
        </div>
      )}

      {/* File Upload Areas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {expandedRequirements.map((req) => {
          const upload = uploads[req.slotId];
          const existingDoc = applicationData.uploadedDocuments.find(d => d.type === req.slotId);
          const isUploaded = upload?.status === 'success' || existingDoc?.uploaded;
          
          return (
            <div
              key={req.slotId}
              className={cn(
                "relative p-2.5 rounded-lg border-2 border-dashed transition-colors",
                isUploaded && "border-green-500 bg-green-50 dark:bg-green-950/20",
                upload?.status === 'error' && "border-destructive bg-destructive/5",
                !isUploaded && !upload?.status && req.isRequired && "border-amber-400/60 hover:border-primary/50",
                !isUploaded && !upload?.status && !req.isRequired && "border-muted-foreground/30 hover:border-primary/50"
              )}
            >
              {req.requiresUpload && (
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(req, file);
                  }}
                  disabled={upload?.status === 'uploading'}
                />
              )}
              
              <div className="flex items-start gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  isUploaded ? "bg-green-100 text-green-600" : "bg-muted"
                )}>
                  {upload?.status === 'uploading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isUploaded ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : upload?.status === 'error' ? (
                    <XCircle className="w-4 h-4 text-destructive" />
                  ) : !req.requiresUpload ? (
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm flex items-center gap-1.5 flex-wrap">
                    <span>{req.name}</span>
                    <span className="text-[10px] text-muted-foreground">• {req.travelerLabel}</span>
                    {req.isRequired && (
                      <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">
                        {direction === 'rtl' ? 'إلزامي' : 'Required'}
                      </Badge>
                    )}
                    {!req.requiresUpload && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
                        {direction === 'rtl' ? 'بدون رفع' : 'No upload'}
                      </Badge>
                    )}
                  </div>
                  {req.description && (
                    <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                      {req.description}
                    </div>
                  )}
                  
                  {upload?.status === 'uploading' && (
                    <div className="mt-1.5">
                      <Progress value={upload.progress} className="h-1" />
                      <span className="text-[10px] text-muted-foreground">
                        {Math.round(upload.progress)}%
                      </span>
                    </div>
                  )}
                  
                  {isUploaded && (upload?.file || existingDoc) && (
                    <div className="flex items-center gap-2 mt-1">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground truncate">
                        {upload?.file?.name || existingDoc?.fileName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({formatFileSize(upload?.file?.size || existingDoc?.fileSize || 0)})
                      </span>
                    </div>
                  )}
                  
                  {upload?.status === 'error' && (
                    <div className="text-[10px] text-destructive mt-0.5">
                      {upload.error}
                    </div>
                  )}
                  
                  {!isUploaded && !upload?.status && req.requiresUpload && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {t('documents.formats')} • {t('documents.maxSize')}
                    </div>
                  )}
                </div>
                
                {isUploaded && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 z-20 relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(req);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons - Sticky on mobile */}
      <div className="flex gap-3 pt-2 sticky bottom-0 bg-background/95 backdrop-blur-sm pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent sm:backdrop-blur-none border-t sm:border-0 mt-2 sm:mt-0">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1 h-10 gap-2 text-sm"
          onClick={goToPreviousStep}
        >
          <ArrowPrevIcon className="w-4 h-4" />
          <span className="hidden xs:inline">{t('wizard.previous')}</span>
          <span className="xs:hidden">{direction === 'rtl' ? 'السابق' : 'Back'}</span>
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1 h-10 gap-2 text-sm"
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
