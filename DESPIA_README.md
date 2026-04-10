# ⚠️ READ THIS FILE BEFORE ANY NATIVE WORK ⚠️

## Despia x Lovable — Native Integration Guide

### Project Info
- **App ID**: com.visafaster.app
- **App Name**: رحلات - خدمات التأشيرات

---

### Deep Linking (TODO — awaiting credentials)

#### iOS — `/.well-known/apple-app-site-association`
- **Team ID**: `<PENDING>`
- **Bundle ID**: `<PENDING>`

#### Android — `/.well-known/assetlinks.json`
- **Package Name**: `<PENDING>`
- **SHA-256 Fingerprint**: `<PENDING>`

Both files must be hosted at the root of the web domain, served as JSON with correct content-type, no redirects.

---

### Safe Areas
Applied globally via CSS env() variables:
- `--safe-area-top` → Header padding
- `--safe-area-bottom` → Footer padding, FloatingWhatsApp position
- `--safe-area-left/right` → MainLayout horizontal padding

---

### Push Notifications (OneSignal) — TODO
- After login, read `despia.onesignalplayerid` and `despia.uuid`
- Send to backend to link device to user profile
- OneSignal App ID: `<PENDING>`

---

### Environment Detection
Use `src/lib/despia.ts`:
- `isDespia()` — running in Despia WebView
- `isDespiaIOS()` / `isDespiaAndroid()` — platform-specific

---

### Documentation Sources
- Safe Areas: CSS env(safe-area-inset-*) + Despia CSS vars
- Deep Links: https://lovable.despia.com (pending fetch)
