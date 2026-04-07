# Task Turtle — PWA Upgrade

## Current State
- Base PWA working: manifest.json, icon-192x192.png, icon-512x512.png in /public, linked in index.html
- index.html has basic meta tags (theme-color, apple-mobile-web-app-capable, apple-touch-icon)
- Service worker is currently UNREGISTERED (stale SWs are unregistered on page load per current script)
- No splash screen, no install button UI, no update banner
- Footer has branding; LoginPage has a `caffeine.ai` attribution link at bottom
- AdminPage has Task Turtle logo (emoji) in navbar — no Caffeine branding
- All pages work fine; Daily + Pickup-Drop task systems intact

## Requested Changes (Diff)

### Add
- `public/sw.js` — advanced service worker:
  - Cache-first strategy for CSS/JS/icons/fonts
  - Network-first strategy for API calls and dynamic data
  - Offline fallback to offline.html for navigation requests
  - Cache versioning + auto-update on new deployment
  - `skipWaiting` + `clients.claim` for instant activation
- `public/offline.html` — standalone offline page (neon green + black, Task Turtle branded)
- `src/components/SplashScreen.tsx` — full-screen splash:
  - Uses existing turtle logo icon
  - Fade-in + zoom + soft neon glow animation
  - On first user interaction: startup chime plays + splash fades out + removed from DOM
  - Sound plays only once per session
- `src/components/InstallButton.tsx` — custom PWA install button:
  - Intercepts `beforeinstallprompt`
  - Shows only when install is available
  - Hides after install
- `src/components/UpdateBanner.tsx` — "New Update Available" toast/banner:
  - Shows when SW detects a waiting update
  - Has "Update Now" button that triggers `skipWaiting` and reloads
- `src/hooks/usePushNotifications.ts` — push notification base:
  - Requests notification permission
  - Stores subscription structure for future push integration
  - Does NOT connect to external services

### Modify
- `index.html`:
  - Replace SW unregistration script with proper SW registration + update detection
  - Ensure all iOS meta tags are present
  - Add `loading="lazy"` hints via meta
- `public/manifest.json`:
  - Add `display_override: ["window-controls-overlay", "standalone"]` for desktop
  - Add `screenshots` field for richer install UI
- `src/App.tsx`:
  - Integrate SplashScreen (show on first load, dismiss on interaction)
  - Integrate InstallButton (show in navbar area)
  - Integrate UpdateBanner
- `src/pages/LoginPage.tsx`:
  - Remove `caffeine.ai` attribution link at bottom
  - Replace bottom section with Task Turtle logo (img tag using /icon-192x192.png) + "Task Turtle" text with neon glow
- `src/components/Navbar.tsx`:
  - Add InstallButton in desktop nav actions area (shows only when available)

### Remove
- SW unregistration script from index.html (replaced with proper SW registration)
- `caffeine.ai` attribution from LoginPage footer

## Implementation Plan
1. Write public/sw.js — versioned cache, cache-first for assets, network-first for API, offline fallback
2. Write public/offline.html — standalone black+green offline page
3. Update index.html — SW registration with update detection events, keep all iOS meta tags
4. Update public/manifest.json — add display_override for desktop
5. Write SplashScreen.tsx — uses /icon-192x192.png, Web Audio API chime, framer-motion animation
6. Write InstallButton.tsx — beforeinstallprompt handler
7. Write UpdateBanner.tsx — SW waiting state listener
8. Write usePushNotifications.ts — notification permission hook
9. Update App.tsx — wire SplashScreen + UpdateBanner
10. Update Navbar.tsx — add InstallButton
11. Update LoginPage.tsx — remove caffeine attribution, add branded footer
