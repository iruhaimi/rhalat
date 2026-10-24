import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEO from '@/components/seo/SEO';

const APP_NAME = 'visa-faster';

function getMcpUrl(): string {
  const configured = import.meta.env.VITE_SUPABASE_URL as string;
  const url = new URL(configured);
  const authority = configured.match(/^https?:\/\/([^/?#]*)/i)?.[1];
  const loopback = /^(?:localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i.test(authority || '');
  if (!authority || authority.includes('@') || configured.includes('?') || configured.includes('#') || (url.protocol === 'http:' && !loopback)) {
    throw new Error('VITE_SUPABASE_URL is invalid');
  }
  const legacy = url.hostname.endsWith('.lovable.cloud') && !url.hostname.startsWith('c--');
  const base = legacy ? `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co` : url.toString().replace(/\/+$/, '');
  return `${base}/functions/v1/mcp`;
}

function CopyBox({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-3" dir="ltr">
      <code className="flex-1 break-all text-sm">{value}</code>
      <Button size="sm" variant="secondary" aria-label="نسخ" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function Section({ title, steps, children }: { title: string; steps: React.ReactNode[]; children?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-3 text-lg font-bold">{title}</h3>
      {children}
      <ol className="list-decimal space-y-2 ps-5 text-sm leading-7 text-muted-foreground">
        {steps.map((s, i) => <li key={i}>{s}</li>)}
      </ol>
    </section>
  );
}

export default function ConnectAI() {
  const mcpUrl = getMcpUrl();
  const claudeLink = `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=${encodeURIComponent(APP_NAME)}&connectorUrl=${encodeURIComponent(mcpUrl)}`;
  const cmd = `claude mcp add --scope user --transport http ${APP_NAME} '${mcpUrl.replace(/'/g, "'\\''")}'`;
  const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">{children}<ExternalLink className="h-3 w-3" /></a>
  );

  return (
    <div className="container-section space-y-6 py-10">
      <SEO title="ربط المساعد الذكي | عطلات رحلاتكم" description="اربط ChatGPT أو Claude بحسابك في عطلات رحلاتكم." />
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">ربط المساعد الذكي بحسابك</h1>
        <p className="text-muted-foreground">يتيح لك المساعد الاطلاع على الدول والتأشيرات وحالة طلباتك بعد تسجيل دخولك.</p>
      </header>

      <section className="space-y-2">
        <h2 className="font-semibold">رابط الربط</h2>
        <CopyBox value={mcpUrl} />
      </section>

      <h2 className="pt-4 text-2xl font-bold">طريقة الربط</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Claude" steps={[
          <A href={claudeLink}>افتح نافذة إضافة الموصل في Claude</A>,
          'راجع الاسم والرابط ثم اضغط "Add".',
          'إذا لم تفتح النافذة: افتح صفحة Connectors واختر "Add custom connector" والصق الرابط.',
          'سجّل دخولك ووافق، ثم فعّل الموصل من مربع الكتابة واطلب من Claude استخدامه.',
        ]} />
        <Section title="ChatGPT" steps={[
          <><A href="https://chatgpt.com/#settings/Connectors/Advanced">افتح الإعدادات</A> وفعّل Developer mode.</>,
          <A href="https://chatgpt.com/plugins#settings/Connectors?create-connector=true&redirectAfter=%2Fplugins">افتح نافذة إضافة تطبيق جديد</A>,
          'الصق اسم التطبيق والرابط في الحقول.',
          'ضع علامة على "I understand and want to continue" ثم اضغط "Create".',
          'فعّل التطبيق من مربع الكتابة واطلب من ChatGPT استخدامه.',
        ]} />
        <Section title="Claude Code" steps={[
          'شغّل الأمر أعلاه في الطرفية.',
          'افتح Claude Code واكتب /mcp للتأكد وتسجيل الدخول.',
          'اطلب من Claude Code استخدام التطبيق.',
        ]}><div className="mb-3"><CopyBox value={cmd} /></div></Section>
        <Section title="مساعدات أخرى" steps={[
          'افتح إعدادات خوادم MCP أو الموصلات.',
          'أنشئ اتصال خادم MCP عن بُعد.',
          'سمّ الاتصال والصق الرابط.',
          'أكمل تسجيل الدخول والموافقة، ثم فعّل الاتصال.',
        ]} />
      </div>

      <h2 className="pt-4 text-2xl font-bold">التحديث بعد تغييرات الموقع</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="ChatGPT" steps={['افتح صفحة Plugins واختر التطبيق.', 'انزل إلى "Information" واضغط "Refresh".', 'إذا تغيّر الرابط: احذف التطبيق وأعد الربط.', 'ابدأ محادثة جديدة.']} />
        <Section title="Claude" steps={['افتح صفحة Connectors واختر الموصل.', 'حدّث أدوات الموصل.', 'إذا تغيّر الرابط: احذف الموصل وأعد الربط.', 'اطلب من Claude استخدامه.']} />
        <Section title="Claude Code" steps={['ابدأ جلسة جديدة لتحميل أحدث الأدوات.', `إذا تغيّر الرابط: نفّذ claude mcp remove ${APP_NAME} ثم أعد أمر التثبيت.`, 'اطلب من Claude Code استخدام التطبيق.']} />
        <Section title="مساعدات أخرى" steps={['افتح إعدادات الاتصال الخاص بالتطبيق.', 'حدّث قائمة الأدوات أو أعد الاتصال.', 'إذا تغيّر الرابط: الصق الرابط الجديد.', 'ابدأ محادثة جديدة.']} />
      </div>
    </div>
  );
}
