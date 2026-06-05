import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  ArrowRight, 
  Shield, 
  Clock, 
  CheckCircle2, 
  Star,
  Plane,
  FileText,
  CreditCard,
  Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { getSharpFlagUrl } from '@/lib/flagUtils';
import type { Country, VisaType } from '@/types/database';

const features = [
  {
    icon: FileText,
    title: 'Easy Application',
    description: 'Simple step-by-step visa application process with guided forms and document checklists.',
  },
  {
    icon: Clock,
    title: 'Fast Processing',
    description: 'Quick turnaround times with real-time tracking of your application status.',
  },
  {
    icon: Shield,
    title: 'Secure & Trusted',
    description: 'Your documents are encrypted and handled with the highest security standards.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Expert assistance available round the clock to help with your queries.',
  },
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Business Traveler',
    content: 'Otolat Rahlatcom made my US business visa application incredibly simple. Got approved in just 5 days!',
    rating: 5,
  },
  {
    name: 'Ahmed Al-Hassan',
    role: 'Student',
    content: 'The document checklist feature saved me so much time. Highly recommend for student visas.',
    rating: 5,
  },
  {
    name: 'Maria Garcia',
    role: 'Tourist',
    content: 'Best visa service I have used. The tracking feature kept me informed throughout.',
    rating: 5,
  },
];

const visaTypes = [
  { name: 'Tourist Visa', icon: '🏖️', description: 'For leisure and tourism purposes' },
  { name: 'Business Visa', icon: '💼', description: 'For business meetings and conferences' },
  { name: 'Student Visa', icon: '🎓', description: 'For academic studies abroad' },
  { name: 'Work Visa', icon: '👔', description: 'For employment opportunities' },
  { name: 'Transit Visa', icon: '✈️', description: 'For passing through a country' },
  { name: 'Medical Visa', icon: '🏥', description: 'For medical treatment abroad' },
];

export default function Home() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCountries() {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name');

      if (!error && data) {
        setCountries(data as Country[]);
      }
      setIsLoading(false);
    }

    fetchCountries();
  }, []);

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero py-20 sm:py-32">
        <div className="container-section relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30">
              Trusted by 10,000+ travelers
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Your Gateway to <br />
              <span className="text-white/90">Seamless Travel</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/80">
              Apply for visas to 50+ countries with our streamlined process. 
              Fast processing, expert guidance, and real-time tracking.
            </p>

            {/* Search Box */}
            <div className="mt-10 mx-auto max-w-xl">
              <div className="flex gap-2 bg-white rounded-lg p-2 shadow-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search destination country..."
                    className="border-0 pl-10 focus-visible:ring-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button asChild>
                  <Link to="/visa-services">
                    Search <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>98% Success Rate</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>Secure Processing</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Fast Turnaround</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
      </section>

      {/* Featured Countries */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="container-section">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Popular Destinations
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start your visa application for these top destinations
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {countries.slice(0, 10).map((country) => (
              <Link
                key={country.id}
                to={`/visa-services?country=${country.code}`}
                className="group flex flex-col items-center rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
              >
                <img
                  src={getSharpFlagUrl(country)}
                  alt={country.name}
                  className="h-10 w-14 rounded object-cover shadow-sm"
                />
                <span className="mt-3 text-sm font-medium text-foreground group-hover:text-primary">
                  {country.name}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link to="/visa-services">
                View All Countries <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Visa Types */}
      <section className="py-16 sm:py-24 bg-muted/50">
        <div className="container-section">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Visa Services We Offer
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Expert assistance for all types of visa applications
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visaTypes.map((type) => (
              <Card key={type.name} className="group transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{type.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <CardDescription>{type.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="link" className="p-0" asChild>
                    <Link to={`/visa-services?type=${type.name.toLowerCase().replace(' ', '-')}`}>
                      Learn More <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="container-section">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get your visa in 4 simple steps
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: 1, icon: Search, title: 'Select Destination', desc: 'Choose your destination country and visa type' },
              { step: 2, icon: FileText, title: 'Fill Application', desc: 'Complete the online application form' },
              { step: 3, icon: CreditCard, title: 'Make Payment', desc: 'Pay securely using multiple payment options' },
              { step: 4, icon: Plane, title: 'Receive Visa', desc: 'Get your approved visa delivered' },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <item.icon className="h-8 w-8" />
                </div>
                <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 bg-muted/50">
        <div className="container-section">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Choose Otolat Rahlatcom?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We make visa applications simple, fast, and stress-free
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 bg-card shadow-sm">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="container-section">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              What Our Customers Say
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of satisfied travelers
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="bg-card">
                <CardContent className="pt-6">
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="mt-4 text-muted-foreground">{testimonial.content}</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 gradient-hero">
        <div className="container-section text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Start Your Journey?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Apply for your visa today and travel with confidence
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/visa-services">
                Apply Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
