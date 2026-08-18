import { useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PHONE_COUNTRIES as countries } from '@/lib/phone';

interface CountryCodePickerProps {
  value: string;
  onChange: (value: string) => void;
  isRTL?: boolean;
}

export default function CountryCodePicker({ value, onChange, isRTL = true }: CountryCodePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedCountry = countries.find(c => c.code === value) || countries[0];

  const filteredCountries = countries.filter(country => 
    country.name.includes(search) || 
    country.nameEn.toLowerCase().includes(search.toLowerCase()) ||
    country.code.includes(search)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[100px] justify-between rounded-xl px-3 font-normal"
        >
          <span className="flex items-center gap-1.5">
            <span className="text-base">{selectedCountry.flag}</span>
            <span className="text-sm">{selectedCountry.code}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 z-50 bg-popover" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isRTL ? 'ابحث عن الدولة...' : 'Search country...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 rounded-lg"
              dir="auto"
            />
          </div>
        </div>
        <div className="max-h-[250px] overflow-y-auto p-1">
          {filteredCountries.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {isRTL ? 'لا توجد نتائج' : 'No results found'}
            </div>
          ) : (
            filteredCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => {
                  onChange(country.code);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent",
                  value === country.code && "bg-accent"
                )}
              >
                <span className="text-xl">{country.flag}</span>
                <span className="flex-1 text-right">{country.name}</span>
                <span className="text-muted-foreground" dir="ltr">{country.code}</span>
                {value === country.code && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
