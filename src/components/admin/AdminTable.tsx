import { ReactNode } from 'react';
import { Mail, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * AdminTable — مكوّن جدول إداري موحّد.
 * يطبّق:
 *  - table-fixed مع colgroup بعروض ثابتة (لا تتأثر بمحتوى الخلية)
 *  - أفقي scroll على الموبايل عبر min-w
 *  - تنسيق header موحّد (bg-muted/50, font-semibold, text-right)
 *  - ارتفاع صف موحّد
 */

export interface AdminTableColumn {
  /** عرض ثابت بصيغة Tailwind: '260px' أو '15%' */
  width: string;
  /** عنوان العمود */
  label?: ReactNode;
  /** محاذاة (افتراضياً يمين للـ RTL) */
  align?: 'right' | 'left' | 'center';
  className?: string;
}

interface AdminTableProps {
  columns: AdminTableColumn[];
  children: ReactNode;
  /** أقل عرض كلي للجدول قبل تفعيل scroll الأفقي */
  minWidth?: string;
  /** ارتفاع صف موحّد */
  rowHeightClass?: string;
  className?: string;
}

export function AdminTable({
  columns,
  children,
  minWidth = '900px',
  className,
}: AdminTableProps) {
  return (
    <TooltipProvider>
      <div className="overflow-x-auto rounded-lg border bg-card" dir="rtl">
        <Table
          dir="rtl"
          className={cn('table-fixed w-full', className)}
          style={{ minWidth }}
        >
          <colgroup>
            {columns.map((c, i) => (
              <col key={i} style={{ width: c.width }} />
            ))}
          </colgroup>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columns.map((c, i) => (
                <TableHead
                  key={i}
                  className={cn(
                    'font-semibold',
                    c.align === 'center'
                      ? 'text-center'
                      : c.align === 'left'
                      ? 'text-left'
                      : 'text-right',
                    c.className,
                  )}
                >
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          {children}
        </Table>
      </div>
    </TooltipProvider>
  );
}

export { TableBody as AdminTableBody, TableRow as AdminTableRow, TableCell as AdminTableCell };

/**
 * EmailCell — خلية بريد إلكتروني موحّدة:
 *  - أيقونة بريد + بريد مقصوص (truncate)
 *  - زر نسخ ظاهر دائماً (لا يعتمد على hover)
 *  - dir="ltr" للبريد لمحاذاة سليمة
 */
export function EmailCell({ email, className }: { email?: string | null; className?: string }) {
  if (!email) return <span className="text-muted-foreground text-sm">-</span>;

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    toast.success('تم نسخ البريد الإلكتروني');
  };

  return (
    <div className={cn('flex items-center gap-2 min-w-0', className)}>
      <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <span
        className="text-sm truncate flex-1 min-w-0"
        dir="ltr"
        title={email}
      >
        {email}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
            onClick={copy}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>نسخ البريد</TooltipContent>
      </Tooltip>
    </div>
  );
}