# Netlify Example

Prosty przykład statycznej strony HTML do deploymentu w Netlify.

## Zawartość

- `index.html` - Główna strona
- `styles.css` - Stylizacja
- `netlify.toml` - Konfiguracja Netlify (publish current dir, no build command)

## Jak użyć

```bash
cd examples/netlify-example
netlify deploy --prod
```

**Uwaga:** `netlify.toml` zapewnia, że Netlify traktuje to jako statyczną stronę bez build command.

## Zawartość

- `index.html` - Główna strona
- `styles.css` - Stylizacja
