Plan: إزالة زر Google Sign-In من الهيدر

**Goal:** Remove the Google sign-in icon/button that appears beside the "تسجيل الدخول" (Login) button in the Arabic header.

**Changes:**
1. **src/components/layout/HeaderArabic.tsx**
   - Remove line 187: `<GoogleSignInButton iconOnly ... />`
   - Remove line 18: `import GoogleSignInButton from '@/components/auth/GoogleSignInButton';` (if unused after removal)
   - No other logic or UI changes.

**Impact:** The "G" Google icon will no longer appear to the left of the "تسجيل الدخول" button on desktop. Mobile nav retains its own Google sign-in button inside the drawer, which is unaffected. All other header elements remain unchanged.