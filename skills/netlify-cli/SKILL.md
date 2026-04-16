---
name: netlify-cli
description: "Instrukcja i gotowe skrypty do zarządzania pełnym cyklem życia aplikacji w Netlify przy pomocy Netlify CLI i bash."
summary: Szybkie, operacyjne instrukcje i skrypty przyspieszające tworzenie, deployment, zarządzanie i kasowanie aplikacji w Netlify przy użyciu CLI i lokalnych narzędzi bash.
---

# Quickstart

- Wymagania: `netlify` CLI zainstalowane. Zaloguj się: `netlify login`.
- Test: `netlify status` powinno pokazać połączony site lub brak.
- Przykład: Utwórz site, zdeployuj statyczną stronę, zarządzaj env vars, skasuj.

## Instalacja CLI

Zobacz dokumentację instalacji: https://docs.netlify.com/cli/get-started/

Przykład dla Linux/macOS: `npm install -g netlify-cli`

Lub przez Homebrew: `brew install netlify-cli`

## Tworzenie site'u

### Nowy site z promptem
```bash
netlify create "My Static Site"
```

### Łączenie z istniejącym repo (continuous deployment)
```bash
netlify init
```

### Manualne łączenie
```bash
netlify link
```

## Przygotowanie przykładu

Stwórz prosty projekt statycznej strony w katalogu `examples/netlify-example/`:

- `index.html`
- `styles.css`
- `netlify.toml` (ważne dla statycznych stron!)

Przykład `netlify.toml` dla statycznej strony:

```toml
[build]
  publish = "."
  command = ""
```

To zapewnia, że Netlify publikuje pliki bezpośrednio bez build command.

Przykład `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Netlify Site</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Hello from Netlify!</h1>
    <p>This is a static example.</p>
</body>
</html>
```

## Deployment

### Manualny deployment
```bash
cd examples/netlify-example
netlify deploy
```

### Production deployment
```bash
netlify deploy --prod
```

### Draft deployment
```bash
netlify deploy --alias draft
```

### Continuous deployment
Po `netlify init`, każdy push do repo automatycznie deployuje.

## Zarządzanie aspektami

### Environment variables
```bash
# Set variable
netlify env:set API_KEY mykey

# Get variable
netlify env:get API_KEY

# Import from .env
netlify env:import .env

# Unset variable
netlify env:unset API_KEY
```

### Functions (serverless)
Jeśli projekt ma functions w `netlify/functions/`:
```bash
netlify functions:list
```

### Logs
```bash
netlify logs
```

### Builds
```bash
# Local build
netlify build

# Dry run
netlify build --dry
```

### Domains
Konfiguracja custom domains przez UI: Sites > [site] > Domain management.

## Kasowanie site'u

### Przez CLI
```bash
# Sprawdź listę site'ów
netlify sites:list

# Usuń po ID
netlify sites:delete <SITE_ID>

# Usuń bez pytania
netlify sites:delete <SITE_ID> --force
```

**Uwaga:** To permanentnie usuwa site, wszystkie deploye, env vars, functions itp.

### Alternatywa przez UI
Jeśli preferujesz UI: Sites > [site] > Site settings > Danger zone > Delete site.

## `scripts/netlify.sh` helper

Zobacz `scripts/netlify.sh` w repo — zawiera funkcje: `create-site`, `deploy-example`, `set-env`, `cleanup`.

## Przykład pełnego cyklu
```bash
# Create site
./scripts/netlify.sh create-site "My Site"

# Deploy example
./scripts/netlify.sh deploy-example

# Set env var
./scripts/netlify.sh set-env API_URL https://api.example.com

# Cleanup (unlink)
./scripts/netlify.sh cleanup
```

## Bezpieczeństwo i środowisko
- Przechowuj secrets w env vars, nie w kodzie.
- Używaj personal access tokens dla CI: https://app.netlify.com/user/applications#personal-access-tokens
- Wyłącz publiczny dostęp do draftów jeśli wrażliwe.

## FAQ / common errors
- 401: Sprawdź login `netlify login`.
- Build fails: Sprawdź `netlify.toml` i build settings.
- Functions not deploying: Upewnij się, że `node_modules` są zainstalowane.

## Verification / Quick checks
- `netlify status` — status site'u
- `netlify sites:list` — lista site'ów
- `netlify env:list` — lista env vars

## References
- Netlify CLI docs: https://docs.netlify.com/cli/get-started/
- `netlify --help` — lokalna dokumentacja CLI