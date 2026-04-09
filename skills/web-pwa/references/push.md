# Push Notifications

Subscription setup, server-side push, and notification event handling.

## Subscribe to push

Request permission in response to user intent, not on page load:

```ts
// src/lib/push.ts

// VAPID public key from your push server (base64url string)
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!("PushManager" in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // Send the subscription to your server
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });

  return sub;
}

export async function unsubscribeFromPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });

  await sub.unsubscribe();
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
```

## Service worker: receive push and show notification

```ts
// sw.ts

// Push payloads should not contain sensitive data — fetch on click instead
self.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json() ?? { title: "New update", body: "" };

  event.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).registration.showNotification(data.title, {
      body:    data.body,
      icon:    "/icons/icon-192.png",
      badge:   "/icons/badge-72.png",
      tag:     data.tag ?? "default",         // replace instead of stacking same-type notifs
      renotify: false,
      data:    { url: data.url ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const targetUrl: string = event.notification.data?.url ?? "/";

  event.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus existing tab if open
        const existing = clients.find((c) => c.url === targetUrl);
        if (existing) return existing.focus();
        // Otherwise open a new tab
        return (self as unknown as ServiceWorkerGlobalScope).clients.openWindow(targetUrl);
      }),
  );
});
```

## Server-side push (Netlify Function with web-push)

```ts
// netlify/functions/send-push.ts
import webpush from "web-push";
import type { Config } from "@netlify/functions";

webpush.setVapidDetails(
  "mailto:admin@example.com",
  Netlify.env.get("VAPID_PUBLIC_KEY")!,
  Netlify.env.get("VAPID_PRIVATE_KEY")!,
);

export default async (req: Request) => {
  const { subscription, title, body, url } = await req.json();

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body, url }),
    );
    return Response.json({ ok: true });
  } catch (err) {
    // 410 Gone means the subscription is expired — remove from DB
    if ((err as { statusCode?: number }).statusCode === 410) {
      await removeSubscription(subscription.endpoint);
      return new Response(null, { status: 410 });
    }
    throw err;
  }
};

export const config: Config = { path: "/api/push/send" };
```

## Rules

- Only send notifications for events the user explicitly opted into.
- Keep notification text short and specific — long messages are truncated.
- Use `tag` to replace stacked notifications of the same type rather than spamming.
- Never include PII, tokens, or sensitive data in push payloads.
- Provide a way to manage notification preferences in the app settings, not just via OS settings.
- Clean up expired push subscriptions (410 responses) from the server immediately.
