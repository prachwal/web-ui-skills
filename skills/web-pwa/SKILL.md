---
name: web-pwa
description: Use when building or reviewing Progressive Web App features including installability, service workers, offline support, background sync, push notifications, and app manifest configuration.
---

# Web PWA Skill

Use this skill when a web app needs to be installable, work offline, or use service workers, background sync, or push notifications.

## Core goals

- Make the app installable and functional without degrading non-PWA experience.
- Limit service worker scope to what is necessary and safe.
- Treat offline support as a progressive layer — the app must work online first.
- Secure push notification flows and respect user permission choices.

## Checklist

- [ ] `manifest.json` is complete: `name`, `short_name`, `start_url`, `display`, `icons` at required sizes.
- [ ] `<link rel="manifest">` is in `<head>` with correct MIME type (`application/manifest+json`).
- [ ] Service worker is registered only when supported and on HTTPS.
- [ ] Service worker scope is explicitly limited to the intended paths.
- [ ] Caching strategy matches content type: network-first for API data, cache-first for static assets.
- [ ] App works without a service worker (offline is progressive enhancement).
- [ ] Stale-while-revalidate or background sync is used for data freshness where appropriate.
- [ ] Push notification permission is requested in context, not immediately on page load.
- [ ] Push payloads do not include sensitive data — fetch on notification click instead.
- [ ] Service worker update strategy notifies the user or refreshes transparently.

## Reference files

### [`references/manifest.md`](references/manifest.md)
**Web app manifest** — Complete `manifest.json` with all required fields (`name`, `short_name`, `start_url`, `display`, icons for 72/192/512/maskable), iOS Safari meta tags, icon size requirements table, maskable icon safe-zone rule, `beforeinstallprompt` capture and `promptInstall()` helper with TypeScript typing.

### [`references/service-worker.md`](references/service-worker.md)
**Service worker lifecycle and caching** — `registerServiceWorker()` with HTTPS guard, `listenForUpdates()` → `showUpdateBanner()`, `SKIP_WAITING` message handler, install/activate/fetch event handlers, network-first for API routes, cache-first for static assets, navigation offline fallback, old cache cleanup, multi-session authentication safety rules.

### [`references/push.md`](references/push.md)
**Push notifications** — `subscribeToPush()` with `requestPermission()` gating and VAPID key setup, `unsubscribeFromPush()` with server cleanup, `urlBase64ToUint8Array` helper, SW `push` event handler (minimal non-PII payload), `notificationclick` with focus-existing-tab logic, Netlify Function `send-push` using `web-push`, subscription expiry (410) handling.

## Testing focus

- Install prompt appears on eligible visits, not on every page load.
- App renders an offline fallback when the network is unavailable.
- Service worker update flow does not silently break the running app.
- Push permission is not requested before user context.
- App passes Lighthouse PWA audit for basic installability.
- Service worker does not cache authenticated responses shared across users.

## External references

- [web.dev: Progressive Web Apps](https://web.dev/learn/pwa/)
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN: Web App Manifests](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Workbox documentation](https://developer.chrome.com/docs/workbox/)
