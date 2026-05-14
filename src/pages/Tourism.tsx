import { useEffect, useState } from 'react';
import SEO from '@/components/seo/SEO';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, Plane } from 'lucide-react';

export default function Tourism() {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<any[]>([]);

  useEffect(() => {
    document.title = 'البرامج السياحية | عطلات رحلاتكم';
    (async () => {
      const { data } = await supabase
        .from('tour_programs')
        .select('*, tour_operators_public(company_name, logo_url)')
        .eq('status', 'approved')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      setPrograms(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background py-8" dir="rtl">
      <SEO title="البرامج السياحية — عطلات رحلاتكم" description="باقات سفر وعطلات سياحية مختارة من شركاء معتمدين، احجز برنامجك التالي بسهولة." path="/tourism" />
      <div className="container mx-auto px-4">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <Plane className="h-6 w-6 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">البرامج السياحية</h1>
          </div>
          <p className="text-muted-foreground">باقات سفر وعطلات مختارة من شركاء سياحيين معتمدين</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : programs.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">
            لا توجد برامج معتمدة حالياً. تصفّح لاحقاً.
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {programs.map((p) => (
              <Link key={p.id} to={`/tourism/${p.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition group">
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {p.cover_image_url ? (
                      <img
                        src={p.cover_image_url}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                        لا توجد صورة
                      </div>
                    )}
                    {p.discounted_price && (
                      <Badge className="absolute top-2 right-2 bg-red-600">عرض خاص</Badge>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold line-clamp-1">{p.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {p.destination}
                    </p>
                    {p.tour_operators_public?.company_name && (
                      <p className="text-xs text-muted-foreground">
                        مقدم من: <strong>{p.tour_operators_public.company_name}</strong>
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        {p.discounted_price ? (
                          <>
                            <span className="font-bold text-lg">
                              {p.discounted_price.toLocaleString()} {p.currency}
                            </span>
                            <span className="text-xs text-muted-foreground line-through mr-2">
                              {p.price.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-lg">
                            {p.price.toLocaleString()} {p.currency}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {p.duration_days}ي / {p.duration_nights}ل
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}