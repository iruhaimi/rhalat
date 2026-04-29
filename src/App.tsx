import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Layouts
import MainLayout from "@/components/layout/MainLayout";
import AdminLayout from "@/components/admin/AdminLayout";
import AgentLayout from "@/components/agent/AgentLayout";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

// Pages
import HomeArabic from "@/pages/HomeArabic";
import Destinations from "@/pages/Destinations";
import CountryDetail from "@/pages/CountryDetail";
import Apply from "@/pages/Apply";
import Pricing from "@/pages/Pricing";
import TrackApplication from "@/pages/TrackApplication";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Refund from "@/pages/Refund";
import TrackRefund from "@/pages/TrackRefund";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentFailed from "@/pages/PaymentFailed";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import MyApplications from "@/pages/MyApplications";
import MyApplicationDetail from "@/pages/MyApplicationDetail";
import SpecialOffers from "@/pages/SpecialOffers";
import ResetPassword from "@/pages/ResetPassword";
import SecureStaffAuth from "@/pages/SecureStaffAuth";
import Install from "@/pages/Install";
import NotFound from "@/pages/NotFound";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ApplicationsList from "@/pages/admin/ApplicationsList";
import ApplicationDetail from "@/pages/admin/ApplicationDetail";
import UsersManagement from "@/pages/admin/UsersManagement";
import Settings from "@/pages/admin/Settings";
import OffersManagement from "@/pages/admin/OffersManagement";
import RefundRequestsManagement from "@/pages/admin/RefundRequestsManagement";
import HeroManagement from "@/pages/admin/HeroManagement";
import LoginAttemptsManagement from "@/pages/admin/LoginAttemptsManagement";
import UnlockRequestsManagement from "@/pages/admin/UnlockRequestsManagement";
import AgentRequestsManagement from "@/pages/admin/AgentRequestsManagement";
import SensitiveOperations from "@/pages/admin/SensitiveOperations";
import OwnerSettings from "@/pages/admin/OwnerSettings";
import DocumentAccessLogs from "@/pages/admin/DocumentAccessLogs";
import FooterManagement from "@/pages/admin/FooterManagement";
import StaffAuditLog from "@/pages/admin/StaffAuditLog";
import PortalSecurity from "@/pages/admin/PortalSecurity";
import DynamicPortalRoute from "@/components/DynamicPortalRoute";
// Agent Pages
import AgentDashboard from "@/pages/agent/AgentDashboard";
import AgentApplicationsList from "@/pages/agent/AgentApplicationsList";
import AgentApplicationDetail from "@/pages/agent/AgentApplicationDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes with Main Layout */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomeArabic />} />
                <Route path="/destinations" element={<Destinations />} />
                <Route path="/country/:countryCode" element={<CountryDetail />} />
                <Route path="/apply" element={<Apply />} />
                <Route path="/apply/:countryCode" element={<Apply />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/track" element={<TrackApplication />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/refund" element={<Refund />} />
                <Route path="/track-refund" element={<TrackRefund />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-failed" element={<PaymentFailed />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/my-applications" element={<MyApplications />} />
                <Route path="/application" element={<MyApplicationDetail />} />
                <Route path="/offers" element={<SpecialOffers />} />
              </Route>

              {/* Auth Routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/portal-x7k9m2" element={<SecureStaffAuth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/install" element={<Install />} />

              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="applications" element={<ApplicationsList />} />
                <Route path="applications/:id" element={<ApplicationDetail />} />
                <Route path="users" element={<UsersManagement />} />
                <Route path="settings" element={<Settings />} />
                <Route path="offers" element={<OffersManagement />} />
                <Route path="refunds" element={<RefundRequestsManagement />} />
                <Route path="hero" element={<HeroManagement />} />
                <Route path="login-attempts" element={<LoginAttemptsManagement />} />
                <Route path="unlock-requests" element={<UnlockRequestsManagement />} />
                <Route path="agent-requests" element={<AgentRequestsManagement />} />
                <Route path="sensitive-operations" element={<SensitiveOperations />} />
                <Route path="owner-settings" element={<OwnerSettings />} />
                <Route path="document-logs" element={<DocumentAccessLogs />} />
                <Route path="footer" element={<FooterManagement />} />
                <Route path="audit-log" element={<StaffAuditLog />} />
                <Route path="portal-security" element={<PortalSecurity />} />
              </Route>

              {/* Agent Routes */}
              <Route 
                path="/agent" 
                element={
                  <ProtectedRoute allowedRoles={['agent', 'admin']}>
                    <AgentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AgentDashboard />} />
                <Route path="applications" element={<AgentApplicationsList />} />
                <Route path="applications/:id" element={<AgentApplicationDetail />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<DynamicPortalRoute fallback={<NotFound />} />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
