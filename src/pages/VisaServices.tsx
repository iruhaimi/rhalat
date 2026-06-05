import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Clock, 
  DollarSign, 
  Calendar,
  ArrowRight,
  CheckCircle2,
  X,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { getSharpFlagUrl } from '@/lib/flagUtils';
import type { Country, VisaType } from '@/types/database';

const visaCategories = [
  { value: 'all', label: 'All Types' },
  { value: 'tourist', label: 'Tourist Visa' },
  { value: 'business', label: 'Business Visa' },
  { value: 'student', label: 'Student Visa' },
  { value: 'work', label: 'Work Visa' },
  { value: 'transit', label: 'Transit Visa' },
];

const processingTimeRanges = [
  { value: 'all', label: 'Any Duration' },
  { value: 'fast', label: '1-3 Days' },
  { value: 'standard', label: '4-7 Days' },
  { value: 'extended', label: '8-14 Days' },
  { value: 'long', label: '15+ Days' },
];

const priceRanges = [
  { value: 'all', label: 'جميع الأسعار' },
  { value: 'budget', label: 'أقل من 50 ر.س' },
  { value: 'mid', label: '50 - 150 ر.س' },
  { value: 'premium', label: '150 - 300 ر.س' },
  { value: 'luxury', label: 'أكثر من 300 ر.س' },
];

export default function VisaServices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [countries, setCountries] = useState<Country[]>([]);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || 'all');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('type') || 'all');
  const [selectedProcessingTime, setSelectedProcessingTime] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      
      const [countriesRes, visaTypesRes] = await Promise.all([
        supabase.from('countries').select('*').eq('is_active', true).order('name'),
        supabase.from('visa_types').select('*, country:countries(*)').eq('is_active', true).order('name'),
      ]);

      if (!countriesRes.error && countriesRes.data) {
        setCountries(countriesRes.data as Country[]);
      }

      if (!visaTypesRes.error && visaTypesRes.data) {
        setVisaTypes(visaTypesRes.data as VisaType[]);
      }

      setIsLoading(false);
    }

    fetchData();
  }, []);

  // Filter visa types based on all criteria
  const filteredVisaTypes = useMemo(() => {
    return visaTypes.filter((visa) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          visa.name.toLowerCase().includes(query) ||
          visa.description?.toLowerCase().includes(query) ||
          (visa.country as Country)?.name.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Country filter
      if (selectedCountry !== 'all') {
        if ((visa.country as Country)?.code !== selectedCountry) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const categoryMatch = visa.name.toLowerCase().includes(selectedCategory.toLowerCase());
        if (!categoryMatch) return false;
      }

      // Processing time filter
      if (selectedProcessingTime !== 'all') {
        const days = visa.processing_days;
        switch (selectedProcessingTime) {
          case 'fast': if (days > 3) return false; break;
          case 'standard': if (days < 4 || days > 7) return false; break;
          case 'extended': if (days < 8 || days > 14) return false; break;
          case 'long': if (days < 15) return false; break;
        }
      }

      // Price range filter
      if (selectedPriceRange !== 'all') {
        const price = visa.price;
        switch (selectedPriceRange) {
          case 'budget': if (price >= 50) return false; break;
          case 'mid': if (price < 50 || price > 150) return false; break;
          case 'premium': if (price < 150 || price > 300) return false; break;
          case 'luxury': if (price <= 300) return false; break;
        }
      }

      return true;
    });
  }, [visaTypes, searchQuery, selectedCountry, selectedCategory, selectedProcessingTime, selectedPriceRange]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCountry('all');
    setSelectedCategory('all');
    setSelectedProcessingTime('all');
    setSelectedPriceRange('all');
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || selectedCountry !== 'all' || selectedCategory !== 'all' || 
    selectedProcessingTime !== 'all' || selectedPriceRange !== 'all';

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Country Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Destination Country</Label>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country.id} value={country.code}>
                <div className="flex items-center gap-2">
                  <img 
                    src={getSharpFlagUrl(country)} 
                    alt="" 
                    className="h-4 w-5 rounded-sm object-cover"
                  />
                  {country.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Visa Type Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Visa Type</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {visaCategories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Processing Time Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Processing Time</Label>
        <Select value={selectedProcessingTime} onValueChange={setSelectedProcessingTime}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {processingTimeRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Price Range</Label>
        <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select price range" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {priceRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy/95 to-brand py-20">
        <div className="absolute -top-32 -end-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="container-section relative">
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-jakarta text-xs font-bold tracking-[0.25em] uppercase text-white/60 mb-3 block">
              Visa Catalog
            </span>
            <h1 className="font-heading-ar text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Visa Services
            </h1>
            <p className="mt-4 font-body-ar text-lg text-white/75">
              Find and apply for visas to 50+ countries worldwide
            </p>

            {/* Search Bar */}
            <div className="mt-8">
              <div className="flex gap-2 bg-white rounded-3xl p-2 shadow-2xl shadow-navy/30">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by country or visa type..."
                    className="border-0 pl-10 focus-visible:ring-0 rounded-2xl py-6 font-body-ar"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="button" className="rounded-2xl px-6 bg-navy hover:bg-navy/90 text-navy-foreground font-bold">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container-section">
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 rounded-3xl border border-border bg-card p-6">
                <h3 className="font-heading-ar font-extrabold text-navy mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4 text-brand" />
                  Filters
                </h3>
                <FilterSidebar />
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1">
              {/* Mobile Filter Button & Results Count */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-muted-foreground font-body-ar">
                  {isLoading ? (
                    <Skeleton className="h-5 w-32" />
                  ) : (
                    <span><span className="font-display font-bold text-navy">{filteredVisaTypes.length}</span> visa services found</span>
                  )}
                </div>

                {/* Mobile Filter */}
                <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden rounded-2xl border-border">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2 rounded-lg">
                          Active
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <SheetHeader>
                      <SheetTitle className="font-heading-ar text-navy">Filter Visa Services</SheetTitle>
                      <SheetDescription className="font-body-ar">
                        Narrow down your search with filters
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterSidebar />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Active Filters Pills */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      Search: {searchQuery}
                      <button onClick={() => setSearchQuery('')}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedCountry !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Country: {countries.find(c => c.code === selectedCountry)?.name}
                      <button onClick={() => setSelectedCountry('all')}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedCategory !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Type: {visaCategories.find(c => c.value === selectedCategory)?.label}
                      <button onClick={() => setSelectedCategory('all')}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedProcessingTime !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Time: {processingTimeRanges.find(r => r.value === selectedProcessingTime)?.label}
                      <button onClick={() => setSelectedProcessingTime('all')}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedPriceRange !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Price: {priceRanges.find(r => r.value === selectedPriceRange)?.label}
                      <button onClick={() => setSelectedPriceRange('all')}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}

              {/* Visa Cards Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden rounded-3xl border-border">
                      <CardHeader className="pb-4">
                        <div className="flex items-start gap-3">
                          <Skeleton className="h-10 w-14 rounded" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <div className="grid grid-cols-2 gap-4">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Skeleton className="h-10 w-full" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : filteredVisaTypes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-24 w-24 rounded-3xl bg-cream flex items-center justify-center mb-4">
                    <Search className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-heading-ar text-xl font-extrabold text-navy">No visa services found</h3>
                  <p className="text-muted-foreground mt-2 font-body-ar">
                    Try adjusting your filters or search query
                  </p>
                  <Button variant="outline" className="mt-4 rounded-2xl border-border" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredVisaTypes.map((visa) => {
                    const country = visa.country as Country;
                    return (
                      <Card key={visa.id} className="overflow-hidden rounded-3xl border-border bg-card transition-all hover:shadow-2xl hover:shadow-navy/5 hover:border-brand/30 hover:-translate-y-1 group">
                        <CardHeader className="pb-4">
                          <div className="flex items-start gap-3">
                            <img
                              src={getSharpFlagUrl(country)}
                              alt={country?.name}
                              className="h-10 w-14 rounded-lg object-cover shadow-sm"
                            />
                            <div className="flex-1 min-w-0">
                              <CardTitle className="font-heading-ar text-lg font-extrabold text-navy truncate">{visa.name}</CardTitle>
                              <CardDescription className="truncate font-body-ar">{country?.name}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground line-clamp-2 font-body-ar">
                            {visa.description || `Apply for a ${visa.name} to ${country?.name}. Fast processing and expert assistance.`}
                          </p>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-cream/60 p-3">
                              <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] mb-1 font-jakarta font-bold uppercase tracking-wider">
                                <Clock className="h-3.5 w-3.5" />
                                Processing
                              </div>
                              <p className="font-display font-bold text-sm text-navy">{visa.processing_days} Days</p>
                            </div>
                            <div className="rounded-2xl bg-cream/60 p-3">
                              <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] mb-1 font-jakarta font-bold uppercase tracking-wider">
                                <Calendar className="h-3.5 w-3.5" />
                                Validity
                              </div>
                              <p className="font-display font-bold text-sm text-navy">
                                {visa.validity_days ? `${visa.validity_days} Days` : 'Varies'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-display text-3xl font-bold text-brand">{visa.price}</span>
                              <span className="text-sm text-muted-foreground mr-1 font-body-ar">ر.س</span>
                            </div>
                            <Badge variant="outline" className="capitalize rounded-xl border-border font-jakarta text-[10px] font-bold">
                              {visa.entry_type === 'single' ? 'دخول واحد' : 'دخول متعدد'}
                            </Badge>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0 gap-2">
                          <Button variant="outline" className="flex-1 rounded-2xl border-border" asChild>
                            <Link to={`/visa/${visa.id}`}>
                              Details
                            </Link>
                          </Button>
                          <Button className="flex-1 rounded-2xl bg-navy hover:bg-navy/90 text-navy-foreground font-bold" asChild>
                            <Link to={`/visa/${visa.id}`}>
                              Apply Now
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Countries Quick Access */}
      <section className="py-16 bg-cream/40">
        <div className="container-section">
          <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-8">Browse by Country</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {countries.map((country) => (
              <button
                key={country.id}
                onClick={() => setSelectedCountry(country.code)}
                className={`flex items-center gap-3 rounded-2xl border p-3 transition-all hover:border-brand hover:shadow-md hover:-translate-y-0.5 ${
                  selectedCountry === country.code ? 'border-brand bg-brand/5' : 'border-border bg-card'
                }`}
              >
                <img
                  src={getSharpFlagUrl(country)}
                  alt={country.name}
                  className="h-7 w-9 rounded-md object-cover shadow-sm"
                />
                <span className="text-sm font-heading-ar font-bold truncate text-navy">{country.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
