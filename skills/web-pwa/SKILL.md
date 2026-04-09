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

## Web app manifest

```json
{
  "name": "Acme Store",
  "short_name": "Acme",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0055cc",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## Service worker registration

```ts
// src/lib/sw-register.ts
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

      // Notify user when an update is ready
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            notifyUpdateReady(reg);
          }
        });
      });
    } catch (err) {
      console.warn("Service worker registration failed", err);
    }
  });
}

function notifyUpdateReady(reg: ServiceWorkerRegistration) {
  // Show a UI prompt — never force reload without user intent
  if (confirm("An update is available. Reload now?")) {
    reg.waiting?.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  }
}
```

## Caching strategies (service worker)

```ts
// sw.ts — Workbox-free example using Cache API directly

const STATIC_CACHE = "static-v1";
const DATA_CACHE = "data-v1";
const STATIC_ASSETS = ["/", "/index.html", "/offline.html"];

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
});

self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(DATA_CACHE).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r ?? new Response("Offline", { status: 503 }))),
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request)),
  );
});
```

## Push notifications

```ts
// Request permission in context (after user action, not on page load)
async function subscribeToPush(publicVapidKey: string): Promise<PushSubscription | null> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
  });
}

// Service worker: on push, show notification — do not include sensitive payload
self.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json() ?? { title: "New notification", body: "" };
  event.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).clients.openWindow(
      event.notification.data?.url ?? "/",
    ),
  );
});
```

## Testing focus

- Install prompt appears on eligible visits, not on every page load.
- App renders an offline fallback when the network is unavailable.
- Service worker update flow does not silently break the running app.
- Push permission is not requested before user context.
- App passes Lighthouse PWA audit for basic installability.
- Service worker does not cache authenticated responses shared across users.

## References

- [web.dev: Progressive Web Apps](https://web.dev/learn/pwa/)
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN: Web App Manifests](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Workbox documentation](https://developer.chrome.com/docs/workbox/)
