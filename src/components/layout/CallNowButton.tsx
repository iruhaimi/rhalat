import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SITE_CONTACT } from '@/config/contact';
import { cn } from '@/lib/utils';

interface CallNowButtonProps {
  label?: string;
  className?: string;
}

export default function CallNowButton({ label = 'اتصل الآن', className }: CallNowButtonProps) {
  return (
    <Button asChild variant="outline" size="lg" className={cn('h-auto min-h-14 whitespace-normal px-5 py-3 text-base', className)}>
      <a href={SITE_CONTACT.phoneHref} aria-label={`${label}: ${SITE_CONTACT.phoneDisplay}`}>
        <Phone aria-hidden="true" />
        <span>{label}</span>
      </a>
    </Button>
  );
}
