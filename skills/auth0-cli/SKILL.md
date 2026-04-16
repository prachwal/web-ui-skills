---
name: auth0-cli
description: "Instrukcja i gotowe skrypty do przyspieszenia operacji CRUD na obiektach Auth0 przy pomocy Auth0 CLI i bash."
summary: Szybkie, operacyjne instrukcje i skrypty przyspieszające tworzenie, edycję i kasowanie obiektów Auth0 przy użyciu Auth0 CLI i lokalnych narzędzi bash.
---

# Quickstart

- Wymagania: `auth0` CLI zainstalowane. Zaloguj się: `auth0 login` lub ustaw env: `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`.
- Test: `auth0 clients list` powinno wypisać klientów w tenantcie testowym.

## Instalacja CLI

Zobacz dokumentację instalacji: https://auth0.com/docs/deploy-monitor/auth0-cli#install-the-cli

Przykład dla Linux/macOS: `curl -sSfL https://raw.githubusercontent.com/auth0/auth0-cli/main/install.sh | sh -s -- -b /usr/local/bin`

## Obsługiwane obiekty
- Clients (applications)
- Resource servers (APIs) - oprócz systemowych jak Auth0 Management API
- Roles
- Users
- Rules (deprecated, migrate to actions)

## Najważniejsze zasady
- Używaj tenancy testowego do eksperymentów.
- Nigdy nie commituj sekretów; korzystaj z env vars i narzędzi secret manager.
- Preferuj `--dry-run` lub `--preview` gdzie dostępne; waliduj payload `jq`.
- Przy czyszczeniu: systemowe obiekty (jak Auth0 Management API) są pomijane.

## Szablony komend

Create client (przykład):

```bash
auth0 apps create --name "my-app" --type regular --callbacks "https://app.example/callback" --json > client.json
```

Update client:

```bash
auth0 apps update <CLIENT_ID> --name "my-app-updated" --json
```

Delete client:

```bash
auth0 apps delete <CLIENT_ID> --force
```

List:

```bash
auth0 apps list --json | jq '.[] | {name: .name, client_id: .client_id}'
```

Batch create users (przykład):

```bash
cat users.csv | ./scripts/auth0.sh batch-create-users --connection "Username-Password-Authentication"
```

## JSON body templates

Client minimalny (`client-template.json`):

```json
{
  "name": "my-app",
  "app_type": "regular_web",
  "callbacks": ["https://app.example/callback"]
}
```

User minimalny (`user-template.json`):

```json
{
  "email": "user@example.com",
  "password": "ChangeMe123!",
  "connection": "Username-Password-Authentication",
  "email_verified": false
}
```

## Bezpieczeństwo i środowisko
- Przechowuj `AUTH0_CLIENT_SECRET` w managerze sekretów.
- Używaj ról i least-privilege do tokenów CLI.
- Wyłącz logowanie pełnych payloadów w production; w skryptach `set -o errexit -o nounset` i `set -o pipefail`.

## Dry-run i walidacje
- Gdy brak natywnego `--dry-run`, buduj JSON lokalnie i sprawdzaj `jq`:

```bash
cat client-template.json | jq .
```

- Sprawdzaj istnienie obiektu przed tworzeniem/kasowaniem:

```bash
auth0 clients list --search "name:my-app" --json | jq 'length'
```

## Rollback i checklisty operacyjne
- Przed działaniem: backup configu: `auth0 tenants export --format json > backup.json` (jeśli dostępne dla twojej wersji CLI).
- Przy tworzeniu: zachowaj wygenerowany `id` i `json` output w katalogu `./tmp/`.
- Przy kasowaniu: zapisz `GET` odpowiednik obiektu w `./tmp/` aby móc przywrócić.

## `scripts/auth0.sh` helper
Zobacz `scripts/auth0.sh` w repo — zawiera funkcje: `create-client`, `update-client`, `delete-client`, `batch-create-users`, `export-config`, `clear-all`.

## Przykład czyszczenia wszystkiego
```bash
./scripts/auth0.sh clear-all
```
To usunie wszystkie apps, resource servers, connections (oprócz auth0), roles, users, rules, hooks.

## FAQ / common errors
- 401/403: sprawdź token/role i `AUTH0_DOMAIN`.
- Validation errors: sprawdź payload JSON i wymagane pola.

## Verification / Quick checks
- `auth0 clients list` — widoczność
- `auth0 clients create --name test-cli --json` — utworzenie
- `auth0 clients delete --client-id <id>` — usunięcie

## Integracja z Netlify

Netlify oferuje extension do integracji z Auth0, umożliwiającą automatyczne tworzenie aplikacji Auth0, łączenie tenantów i generowanie environment variables dla funkcji serverless.

### Jak skonfigurować
1. W Netlify UI: Sites > [your-site] > Site settings > Extensions > Install Auth0.
2. Połącz tenant Auth0 (podaj domain, client_id, secret).
3. Extension utworzy aplikację Auth0 dla twojego site'u i wygeneruje env vars jak `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`.

### Zarządzanie przez CLI
Netlify CLI nie obsługuje bezpośrednio extensions — zarządzanie odbywa się przez UI Netlify. Użyj Auth0 CLI do zarządzania obiektami po skonfigurowaniu extension.

### Przykład workflow
- Skonfiguruj extension w Netlify UI.
- Użyj Auth0 CLI do tworzenia dodatkowych aplikacji/APIs: `auth0 apps create --name "netlify-app" --json`.
- Deploy funkcji z env vars wygenerowanymi przez extension.

Zobacz docs: https://docs.netlify.com/integrations/auth0/

## References
- Auth0 CLI docs: https://auth0.com/docs/deploy-monitor/auth0-cli
- `auth0 help` — lokalna dokumentacja CLI

