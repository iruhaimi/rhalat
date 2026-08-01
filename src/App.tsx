import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Layouts
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

// Public Pages — eager (critical path)
import HomeArabic from "@/pages/HomeArabic";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import DynamicPortalRoute from "@/components/DynamicPortalRoute";
import GTagMonitor from "@/components/analytics/GTagMonitor";

// Public Pages — lazy
const Destinations = lazy(() => import("@/pages/Destinations"));
const CountryDetail = lazy(() => import("@/pages/CountryDetail"));
const Apply = lazy(() => import("@/pages/Apply"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const TrackApplication = lazy(() => import("@/pages/TrackApplication"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Refund = lazy(() => import("@/pages/Refund"));
const DeleteAccount = lazy(() => import("@/pages/DeleteAccount"));
const TrackRefund = lazy(() => import("@/pages/TrackRefund"));
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));
const PaymentFailed = lazy(() => import("@/pages/PaymentFailed"));
const Profile = lazy(() => import("@/pages/Profile"));
const MyApplications = lazy(() => import("@/pages/MyApplications"));
const MyApplicationDetail = lazy(() => import("@/pages/MyApplicationDetail"));
const SpecialOffers = lazy(() => import("@/pages/SpecialOffers"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Install = lazy(() => import("@/pages/Install"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const Tourism = lazy(() => import("@/pages/Tourism"));
const TourismDetail = lazy(() => import("@/pages/TourismDetail"));
const OfficialEmbassies = lazy(() => import("@/pages/OfficialEmbassies"));
const GTagCheck = lazy(() => import("@/pages/GTagCheck"));
const LandingVisa = lazy(() => import("@/pages/LandingVisa"));

// Admin — lazy
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const ApplicationsList = lazy(() => import("@/pages/admin/ApplicationsList"));
const ApplicationDetail = lazy(() => import("@/pages/admin/ApplicationDetail"));
const UsersManagement = lazy(() => import("@/pages/admin/UsersManagement"));
const Settings = lazy(() => import("@/pages/admin/Settings"));
const OffersManagement = lazy(() => import("@/pages/admin/OffersManagement"));
const RefundRequestsManagement = lazy(() => import("@/pages/admin/RefundRequestsManagement"));
const HeroManagement = lazy(() => import("@/pages/admin/HeroManagement"));
const LoginAttemptsManagement = lazy(() => import("@/pages/admin/LoginAttemptsManagement"));
const UnlockRequestsManagement = lazy(() => import("@/pages/admin/UnlockRequestsManagement"));
const AgentRequestsManagement = lazy(() => import("@/pages/admin/AgentRequestsManagement"));
const SensitiveOperations = lazy(() => import("@/pages/admin/SensitiveOperations"));
const OwnerSettings = lazy(() => import("@/pages/admin/OwnerSettings"));
const DocumentAccessLogs = lazy(() => import("@/pages/admin/DocumentAccessLogs"));
const FooterManagement = lazy(() => import("@/pages/admin/FooterManagement"));
const PartnersManagement = lazy(() => import("@/pages/admin/PartnersManagement"));
const StaffAuditLog = lazy(() => import("@/pages/admin/StaffAuditLog"));
const EmailLogsManagement = lazy(() => import("@/pages/admin/EmailLogsManagement"));
const PortalSecurity = lazy(() => import("@/pages/admin/PortalSecurity"));
const SecurityStatus = lazy(() => import("@/pages/admin/SecurityStatus"));
const QuickSettings = lazy(() => import("@/pages/admin/QuickSettings"));
const AIAssistant = lazy(() => import("@/pages/admin/AIAssistant"));
const AIAssistantHistory = lazy(() => import("@/pages/admin/AIAssistantHistory"));
const AIToolAuditLog = lazy(() => import("@/pages/admin/AIToolAuditLog"));
const SEOContentManagement = lazy(() => import("@/pages/admin/SEOContentManagement"));
const BlogManagement = lazy(() => import("@/pages/admin/BlogManagement"));
const BlogPostEditor = lazy(() => import("@/pages/admin/BlogPostEditor"));
const TourProgramsManagement = lazy(() => import("@/pages/admin/TourProgramsManagement"));
const TourOperatorsApproval = lazy(() => import("@/pages/admin/TourOperatorsApproval"));
const VisaRequirementsManagement = lazy(() => import("@/pages/admin/VisaRequirementsManagement"));

// Agent — lazy
const AgentLayout = lazy(() => import("@/components/agent/AgentLayout"));
const AgentDashboard = lazy(() => import("@/pages/agent/AgentDashboard"));
const AgentApplicationsList = lazy(() => import("@/pages/agent/AgentApplicationsList"));
const AgentApplicationDetail = lazy(() => import("@/pages/agent/AgentApplicationDetail"));

// Tour Operator Portal — lazy
const TourOperatorLayout = lazy(() => import("@/components/tourism/TourOperatorLayout"));
const TourOperatorDashboard = lazy(() => import("@/pages/tourism-portal/Dashboard"));
const TourOperatorCompanyProfile = lazy(() => import("@/pages/tourism-portal/CompanyProfile"));
const TourOperatorMyPrograms = lazy(() => import("@/pages/tourism-portal/MyPrograms"));
const TourOperatorMyBookings = lazy(() => import("@/pages/tourism-portal/MyBookings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GTagMonitor />
            <Suspense fallback={<RouteFallback />}>
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
                <Route path="/delete-account" element={<DeleteAccount />} />
                <Route path="/track-refund" element={<TrackRefund />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-failed" element={<PaymentFailed />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/my-applications" element={<MyApplications />} />
                <Route path="/application" element={<MyApplicationDetail />} />
                <Route path="/offers" element={<SpecialOffers />} />
                <Route path="/tourism" element={<Tourism />} />
                <Route path="/tourism/:id" element={<TourismDetail />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/official-embassies" element={<OfficialEmbassies />} />
              </Route>

              {/* Auth Routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/install" element={<Install />} />
              <Route path="/__gtag-check" element={<GTagCheck />} />

              {/* Landing Pages (no main layout, for Google Ads campaigns) */}
              <Route path="/lp/visa" element={<LandingVisa />} />

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
                <Route path="visa-requirements" element={<VisaRequirementsManagement />} />
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
                <Route path="partners" element={<PartnersManagement />} />
                <Route path="audit-log" element={<StaffAuditLog />} />
                <Route path="portal-security" element={<PortalSecurity />} />
                <Route path="email-logs" element={<EmailLogsManagement />} />
                <Route path="security-status" element={<SecurityStatus />} />
                <Route path="quick-settings" element={<QuickSettings />} />
                <Route path="tour-programs" element={<TourProgramsManagement />} />
                <Route path="tour-operators" element={<TourOperatorsApproval />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
                <Route path="ai-assistant/history" element={<AIAssistantHistory />} />
                <Route path="ai-assistant/audit" element={<AIToolAuditLog />} />
                <Route path="seo-content" element={<SEOContentManagement />} />
                <Route path="blog" element={<BlogManagement />} />
                <Route path="blog/new" element={<BlogPostEditor />} />
                <Route path="blog/:id/edit" element={<BlogPostEditor />} />
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

              {/* Tour Operator Portal */}
              <Route
                path="/tourism-portal"
                element={
                  <ProtectedRoute allowedRoles={['tour_operator']}>
                    <TourOperatorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<TourOperatorDashboard />} />
                <Route path="company" element={<TourOperatorCompanyProfile />} />
                <Route path="programs" element={<TourOperatorMyPrograms />} />
                <Route path="bookings" element={<TourOperatorMyBookings />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<DynamicPortalRoute fallback={<NotFound />} />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
