import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import SARSymbol from '@/components/ui/SARSymbol';

interface TravelerCounterProps {
  label: string;
  description: string;
  value: number;
  price: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export default function TravelerCounter({
  label,
  description,
  value,
  price,
  min = 0,
  max = 10,
  onChange,
}: TravelerCounterProps) {
  const { direction } = useLanguage();
  
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className="flex flex-col items-center text-center p-4 bg-card rounded-2xl border border-border gap-3 hover:border-navy/30 hover:shadow-md hover:shadow-navy/5 transition-all">
      <div className="w-full">
        <div className="font-bold text-base text-navy">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
        <div className="text-xs font-display font-semibold text-brand mt-1 flex items-center justify-center gap-1">
          {price.toLocaleString()}
          <SARSymbol size="xs" className="text-brand" />
          <span className="text-muted-foreground font-normal">
            {direction === 'rtl' ? '/ للشخص' : '/ person'}
          </span>
        </div>
      </div>

      {/* Counter Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "h-11 w-11 rounded-full text-lg font-bold border-2 border-border hover:bg-navy hover:text-white hover:border-navy",
            value <= min && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleDecrement}
          disabled={value <= min}
        >
          <Minus className="h-5 w-5" />
        </Button>

        <span className="w-16 text-center text-4xl font-display font-black tabular-nums tracking-tight text-navy">{value}</span>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "h-11 w-11 rounded-full text-lg font-bold border-2 border-border hover:bg-navy hover:text-white hover:border-navy",
            value >= max && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleIncrement}
          disabled={value >= max}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
