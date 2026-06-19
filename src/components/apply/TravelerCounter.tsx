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
    <div className="flex flex-col items-center text-center p-2.5 bg-card rounded-2xl border border-border gap-2 hover:border-navy/30 hover:shadow-md hover:shadow-navy/5 transition-all">
      <div className="w-full">
        <div className="font-bold text-sm text-navy">{label}</div>
        <div className="text-[10px] font-numeric font-semibold tabular-nums text-brand mt-0.5 flex items-center justify-center gap-1">
          {price.toLocaleString()}
          <SARSymbol size="xs" className="text-brand" />
          <span className="text-muted-foreground font-normal">
            {direction === 'rtl' ? '/ للشخص' : '/ person'}
          </span>
        </div>
      </div>

      {/* Counter Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-full text-lg font-bold border-2 border-border hover:bg-navy hover:text-white hover:border-navy",
            value <= min && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleDecrement}
          disabled={value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <span className="w-12 text-center text-2xl font-numeric font-extrabold tabular-nums text-navy">{value}</span>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-full text-lg font-bold border-2 border-border hover:bg-navy hover:text-white hover:border-navy",
            value >= max && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleIncrement}
          disabled={value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
