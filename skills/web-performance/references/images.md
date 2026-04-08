# Images and asset delivery

## Format selection

| Format | Use case |
|---|---|
| **WebP** | Photos, complex illustrations — 25–35% smaller than JPEG |
| **AVIF** | Best compression for photos; check browser support |
| **SVG** | Icons, logos, illustrations — scales perfectly, tiny files |
| **PNG** | Transparency with sharp edges; large file, avoid for photos |
| **JPEG** | Fallback for photos when WebP/AVIF not supported |

Use `<picture>` to serve modern formats with a JPEG fallback:

```html
<picture>
  <source srcset="/hero.avif" type="image/avif">
  <source srcset="/hero.webp" type="image/webp">
  <img src="/hero.jpg" alt="Hero" width="1200" height="600" loading="eager" fetchpriority="high">
</picture>
```

## Responsive images

Serve different sizes based on viewport width using `srcset` and `sizes`:

```html
<img
  src="/product-800.webp"
  srcset="/product-400.webp 400w, /product-800.webp 800w, /product-1200.webp 1200w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
  alt="Product photo"
  width="800"
  height="600"
  loading="lazy"
>
```

Rules:
- Always include `width` and `height` to prevent CLS.
- Use `loading="lazy"` for below-the-fold images.
- Use `loading="eager"` + `fetchpriority="high"` for the LCP image only.

## Compression targets

- JPEG / WebP quality 75–85 covers most use cases.
- Aim for < 100 KB per above-the-fold image, < 50 KB for thumbnails.
- Use `sharp` (Node.js) or Squoosh CLI for build-time compression:

```bash
npx @squoosh/cli --webp '{"quality":80}' images/*.jpg
```

## CDN and caching

- Serve all static assets through a CDN.
- Set long `Cache-Control: public, max-age=31536000, immutable` on content-hashed assets.
- Use cache-busting filenames (hash suffix) so stale clients get updates automatically.

## Lazy loading and Intersection Observer

```ts
// Manual lazy image with IntersectionObserver (when native loading="lazy" is insufficient)
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const img = entry.target as HTMLImageElement;
      img.src = img.dataset.src!;
      observer.unobserve(img);
    }
  }
}, { rootMargin: '200px' });

document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
```

## Background images

Use CSS `image-set` for responsive background images:

```css
.hero {
  background-image: image-set(
    url('/hero.avif') type('image/avif'),
    url('/hero.webp') type('image/webp'),
    url('/hero.jpg')  type('image/jpeg')
  );
  background-size: cover;
}
```

## Video optimization

- Use `<video>` with `autoplay muted playsinline loop` for decorative background videos.
- Prefer WebM over MP4 for smaller size; include MP4 as fallback.
- Set `preload="none"` for below-the-fold videos to save bandwidth.
- Keep decorative video loops under 3 MB; poster image shown while loading.

## Checklist

- [ ] LCP image uses `fetchpriority="high"` + `loading="eager"`
- [ ] All images have `width` and `height` attributes
- [ ] WebP/AVIF served with JPEG fallback via `<picture>`
- [ ] Images compressed to appropriate quality
- [ ] Below-the-fold images use `loading="lazy"`
- [ ] Static assets served via CDN with immutable `Cache-Control`
