import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  SlidersHorizontal,
  RotateCcw,
  Gauge,
  Sparkles,
  LayoutGrid,
  Crown,
  AlertTriangle,
  PanelLeftClose,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import {
  useAdminUIPrefs,
  type AdminUIPrefs,
} from '@/hooks/useAdminUIPrefs';
import { useToast } from '@/hooks/use-toast';

type ToggleDef = {
  key: keyof AdminUIPrefs;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
};

const SECTIONS: { title: string; items: ToggleDef[] }[] = [
  {
    title: 'الكثافة والحركة',
    items: [
      {
        key: 'compactDensity',
        icon: Gauge,
        title: 'وضع مدمج',
        description: 'تقليل الهوامش والتباعد لعرض محتوى أكثر على الشاشة',
      },
      {
        key: 'reduceMotion',
        icon: Sparkles,
        title: 'تقليل الحركة',
        description: 'تعطيل الانتقالات والتأثيرات (مناسب للأجهزة البطيئة)',
      },
    ],
  },
  {
    title: 'العناصر المرئية',
    items: [
      {
        key: 'hideStatCards',
        icon: LayoutGrid,
        title: 'إخفاء بطاقات الإحصائيات',
        description: 'إخفاء صفّ البطاقات العلوية في صفحات الإدارة',
      },
      {
        key: 'hideRoleBadges',
        icon: Crown,
        title: 'إخفاء شارات الأدوار',
        description: 'إخفاء شارات (مالك / مشرف / وكيل) من القوائم',
      },
      {
        key: 'hideUrgentBanner',
        icon: AlertTriangle,
        title: 'إخفاء لوحة المهام العاجلة',
        description: 'إخفاء لوحة المهام العاجلة من /admin',
      },
    ],
  },
  {
    title: 'القائمة الجانبية',
    items: [
      {
        key: 'sidebarCollapsedDefault',
        icon: PanelLeftClose,
        title: 'بدء القائمة مطوية',
        description: 'فتح لوحة التحكم بقائمة جانبية مصغّرة افتراضيًا',
      },
      {
        key: 'showSidebarBadges',
        icon: Bell,
        title: 'إظهار نقاط الإشعار',
        description: 'إظهار مؤشرات الإشعارات بجانب عناصر القائمة',
      },
    ],
  },
];

export default function QuickSettings() {
  const { prefs, update, reset } = useAdminUIPrefs();
  const { toast } = useToast();

  const handleReset = () => {
    reset();
    toast({
      title: 'تمت إعادة الضبط',
      description: 'تم استرجاع الإعدادات الافتراضية لجميع الخيارات.',
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        icon={SlidersHorizontal}
        title="إعدادات سريعة"
        description="تحكّم بمظهر لوحة الإدارة وكثافة العرض. التغييرات تُحفظ تلقائيًا في هذا الجهاز."
        actions={
          <Button onClick={handleReset} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            إعادة الضبط
          </Button>
        }
      />

      <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
        هذه الإعدادات شخصية وتُطبَّق على هذا المتصفّح فقط — لن تؤثّر على باقي
        المشرفين أو الإعدادات العامة للنظام.
      </div>

      <div className="grid gap-6">
        {SECTIONS.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {section.title}
            </h2>
            <Card>
              <CardContent className="divide-y p-0">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const checked = Boolean(prefs[item.key]);
                  return (
                    <label
                      key={item.key}
                      htmlFor={`pref-${item.key}`}
                      className="flex cursor-pointer items-start justify-between gap-4 p-4 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.title}</p>
                            {checked && (
                              <Badge variant="secondary" className="text-[10px]">
                                مفعّل
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id={`pref-${item.key}`}
                        checked={checked}
                        onCheckedChange={(v) => update({ [item.key]: v })}
                      />
                    </label>
                  );
                })}
              </CardContent>
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}