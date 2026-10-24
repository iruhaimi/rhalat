# visa-faster — Guidelines

## Components

The design system exports these components — import them from `@ws-gklbmiodsavvxlpchx6f/616b2e7f-7e45-4cdc-90ea-1c048e4da3b0` and compose them before building anything from scratch:

`AdminLayout`, `AdvancedCaptcha`, `AgentLayout`, `AgentNotesPerformance`, `AgentPerformanceCard`, `AgentPerformanceChart`, `AgentsComparisonTable`, `AppleSignInButton`, `ApplicationTrendsChart`, `AuthGateModal`, `CTASection`, `ComplianceDisclaimer`, `CookieConsent`, `CountriesSection`, `CountryApplicationsChart`, `CountryCodePicker`, `DynamicPortalRoute`, `FAQSection`, `FeaturesSection`, `FloatingWhatsApp`, `FooterArabic`, `Footer`, `GTagMonitor`, `GoogleSignInButton`, `HeaderArabic`, `Header`, `HeroSection`, `HowItWorksSection`, `IdleWarningDialog`, `MainLayout`, `MiniCTA`, `MobileNavDrawer`, `NoIndex`, `PartnersSection`, `PathChoiceCard`, `PerformanceMetricsCard`, `PriceSummaryCard`, `ProcessingProgressBar`, `ProtectedRoute`, `PublicLayout`, `RecentActivityFeed`, `RecoveryCodeVerification`, `RecoveryCodesDisplay`, `RevenueStatsCard`, `SARSymbol`, `SimpleCaptcha`, `StatsSection`, `StatusDistributionChart`, `Step2VisaDetails`, `Step4Documents`, `Step6Payment`, `StickyCTABar`, `TestimonialsSection`, `TourOperatorLayout`, `TravelerCounter`, `TwoFactorVerification`, `UnlockRequestForm`, `WizardStepper`, `WorkingHoursEditor`

Per-component details (import stanzas, props, variants, examples) live in `.lovable/rules/libraries/{slug}/components.md` — on disk, not auto-loaded. Read that file or the component source when the name alone isn't enough.

## Theme Files

The design system's theme is delivered through the following files. The author's original source files carry the full wiring the design system needs — variable declarations, framework-specific directives, provider objects, etc. — and are the canonical import target.

- `@ws-gklbmiodsavvxlpchx6f/616b2e7f-7e45-4cdc-90ea-1c048e4da3b0/index.css` (source — preferred import)
- `@ws-gklbmiodsavvxlpchx6f/616b2e7f-7e45-4cdc-90ea-1c048e4da3b0/dist/tokens.css` (auto-generated flat list of CSS custom properties — a raw-values fallback only; does NOT carry framework-specific wiring that the source files above provide)

