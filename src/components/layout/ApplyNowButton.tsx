import { FileCheck2 } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ApplyNowButtonProps {
  label?: string;
  className?: string;
}

export default function ApplyNowButton({ label = 'قدّم الآن', className }: ApplyNowButtonProps) {
  return (
    <Button asChild size="lg" className={cn('h-auto min-h-14 whitespace-normal px-5 py-3 text-base', className)}>
      <Link to="/apply" aria-label={label}>
        <FileCheck2 aria-hidden="true" />
        <span>{label}</span>
      </Link>
    </Button>
  );
}
