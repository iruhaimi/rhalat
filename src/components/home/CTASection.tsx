import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plane, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CTASectionProps {
  t: (key: string) => string;
}

export default function CTASection({ t }: CTASectionProps) {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating Elements */}
      <motion.div
        className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10 blur-xl"
        animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white/10 blur-xl"
        animate={{ y: [0, -20, 0], x: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity }}
      />

      <div className="container-section relative">
        <div className="max-w-3xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Icon */}
            <motion.div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Plane className="h-8 w-8" />
            </motion.div>

            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              جاهز لبدء رحلتك؟
            </h2>
            <p className="text-xl text-white/80 mb-10 leading-relaxed">
              قدّم على تأشيرتك اليوم مع عطلات رحلاتكم
              <br />
              واستمتع بخدمة احترافية وسريعة
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                variant="secondary" 
                className="rounded-full px-8 h-14 text-lg shadow-xl hover:shadow-2xl transition-shadow"
                asChild
              >
                <Link to="/apply">
                  ابدأ طلبك الآن
                  <ArrowLeft className="h-5 w-5 mr-2" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full px-8 h-14 text-lg border-white/30 text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <a href="tel:562525665">
                  <Phone className="h-5 w-5 ml-2" />
                  اتصل بنا: 562525665
                </a>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span>معالجة سريعة</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span>أسعار تنافسية</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span>دعم متواصل</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
