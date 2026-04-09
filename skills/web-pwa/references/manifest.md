# Web App Manifest

Manifest configuration and link placement for PWA installability.

## manifest.json

```json
{
  "name": "Acme Store",
  "short_name": "Acme",
  "description": "Shop Acme products — fast, offline-ready.",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#ffffff",
  "theme_color": "#0055cc",
  "lang": "en",
  "dir": "ltr",
  "categories": ["shopping", "lifestyle"],
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Acme Store desktop view"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Acme Store mobile view"
    }
  ],
  "shortcuts": [
    {
      "name": "My Orders",
      "url": "/orders",
      "icons": [{ "src": "/icons/shortcut-orders.png", "sizes": "96x96" }]
    }
  ]
}
```

## HTML link placement

In `<head>`, apply the manifest link and theme color:

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#0055cc" />

<!-- iOS Safari (does not use the manifest for splash screens) -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Acme" />
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
```

## Icon requirements

| Size | Purpose |
|---|---|
| 192×192 | Android Chrome install prompt, home screen |
| 512×512 | Splash screen, app store previews |
| 512×512 maskable | Adaptive icons (Android adaptive icon, fills the icon shape) |
| 180×180 | iOS Safari / Apple Touch Icon (separate file, not in manifest) |
| 96×96 | Shortcuts |

Maskable icons need at least 10% safe zone padding on all sides. The icon contents should sit inside a centered circle of ≈ 80% of the icon size.

## install prompt (beforeinstallprompt)

Capture and show at the right moment — not immediately on page load:

```ts
// src/lib/pwa-install.ts
let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function initInstallPrompt(onReady: () => void) {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    onReady();
  });
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredPrompt) return "unavailable";
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome as "accepted" | "dismissed";
}

// TypeScript: BeforeInstallPromptEvent is not in the standard lib
interface BeforeInstallPromptEvent extends Event {
  prompt(): void;
  userChoice: Promise<{ outcome: string }>;
}
```

Trigger `promptInstall()` only in context: after a user has engaged with content, on a dedicated "Install app" button, or after a business event like completing first order.
