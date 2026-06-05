import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-canvas overflow-hidden" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy/95 to-brand opacity-[0.04]" />
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, hsl(var(--brand)/0.15), transparent 40%), radial-gradient(circle at 70% 70%, hsl(var(--navy)/0.15), transparent 40%)' }} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative text-center px-4"
      >
        <div className="font-display text-[10rem] md:text-[14rem] leading-none font-black bg-gradient-to-br from-navy to-brand bg-clip-text text-transparent">
          404
        </div>
        <h1 className="font-heading-ar text-3xl md:text-4xl font-black text-navy mb-3">
          الصفحة غير موجودة
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.
        </p>
        <Button asChild size="lg" className="rounded-2xl bg-navy hover:bg-navy/90 text-white h-12 px-8">
          <Link to="/">
            <Home className="w-5 h-5 ml-2" />
            العودة للرئيسية
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
