# Service Worker

Registration, lifecycle, update notifications, and caching strategies.

## Registration

```ts
// src/lib/sw-register.ts
export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost") return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => listenForUpdates(reg))
      .catch((err) => console.warn("SW registration failed:", err));
  });
}

function listenForUpdates(reg: ServiceWorkerRegistration): void {
  reg.addEventListener("updatefound", () => {
    const worker = reg.installing;
    if (!worker) return;

    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        // A new version is waiting — notify the user
        showUpdateBanner(reg);
      }
    });
  });
}

function showUpdateBanner(reg: ServiceWorkerRegistration): void {
  // Replace with your UI toast/banner
  const accept = confirm("App update available. Reload now?");
  if (accept) {
    reg.waiting?.postMessage({ type: "SKIP_WAITING" });
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }
}
```

In the service worker itself, handle `SKIP_WAITING`:

```ts
// sw.ts
self.addEventListener("message", (event: MessageEvent) => {
  if (event.data?.type === "SKIP_WAITING") {
    (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
  }
});
```

## Caching strategies

```ts
// sw.ts — Workbox-free, using Cache API directly
const CACHE_STATIC = "static-v2";
const CACHE_DATA   = "data-v1";
const OFFLINE_URL  = "/offline.html";

const STATIC_ASSETS = [
  "/",
  "/offline.html",
  // Vite hashes app assets, so add only the shell HTML and assets you know are stable
];

// Install: precache shell
self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  // Activate immediately (alongside SKIP_WAITING message)
  (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
});

// Activate: delete old caches
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_STATIC && k !== CACHE_DATA)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  (self as unknown as ServiceWorkerGlobalScope).clients.claim();
});

// Fetch: strategy per route
self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // API: network-first, fall back to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets: cache-first
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation: network-first, offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL) ?? new Response("Offline", { status: 503 })),
    );
    return;
  }
});

async function networkFirst(request: Request): Promise<Response> {
  try {
    const res = await fetch(request);
    const cache = await caches.open(CACHE_DATA);
    cache.put(request, res.clone());
    return res;
  } catch {
    return (await caches.match(request)) ?? new Response(JSON.stringify({ error: "Offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  const cache = await caches.open(CACHE_STATIC);
  cache.put(request, res.clone());
  return res;
}
```

## Security constraints

- Do not cache authenticated API responses that could be shared across sessions or users.
- Use user-specific cache keys (e.g. `data-${userId}-v1`) if caching private data.
- Clear user-specific caches on logout: call `caches.delete(userCacheKey)` from the main thread.
- Never cache responses that set `Set-Cookie` in service worker code.
- Keep the SW scope as narrow as possible (`{ scope: "/app/" }` instead of `{ scope: "/" }`) unless the whole origin needs offline support.
