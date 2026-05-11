import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Tone = 'primary' | 'gold' | 'danger' | 'muted' | 'success';

const toneStyles: Record<
  Tone,
  { ring: string; bg: string; icon: string; value: string; accent: string }
> = {
  primary: {
    ring: 'ring-primary/20',
    bg: 'bg-primary/10',
    icon: 'text-primary',
    value: 'text-foreground',
    accent: 'from-primary/10 to-transparent',
  },
  gold: {
    ring: 'ring-amber-400/30',
    bg: 'bg-amber-100/70 dark:bg-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-400',
    accent: 'from-amber-300/15 to-transparent',
  },
  danger: {
    ring: 'ring-destructive/20',
    bg: 'bg-destructive/10',
    icon: 'text-destructive',
    value: 'text-foreground',
    accent: 'from-destructive/10 to-transparent',
  },
  muted: {
    ring: 'ring-border',
    bg: 'bg-muted',
    icon: 'text-muted-foreground',
    value: 'text-foreground',
    accent: 'from-muted to-transparent',
  },
  success: {
    ring: 'ring-emerald-400/30',
    bg: 'bg-emerald-100/70 dark:bg-emerald-500/10',
    icon: 'text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-700 dark:text-emerald-400',
    accent: 'from-emerald-300/15 to-transparent',
  },
};

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
  index?: number;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'primary',
  hint,
  index = 0,
  className,
}: StatCardProps) {
  const t = toneStyles[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5',
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -top-12 -end-12 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl opacity-60',
          t.accent,
        )}
      />
      <div className="relative flex items-center gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-105',
            t.bg,
            t.ring,
          )}
        >
          <Icon className={cn('h-5 w-5', t.icon)} />
        </div>
        <div className="min-w-0">
          <p className={cn('text-2xl font-bold leading-tight tabular-nums', t.value)}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          {hint && (
            <p className="text-[10px] text-muted-foreground/80 mt-0.5">{hint}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default StatCard;