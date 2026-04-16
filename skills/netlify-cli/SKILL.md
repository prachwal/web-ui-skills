---
name: netlify-cli
description: "Instructions and ready-made scripts for managing the full lifecycle of applications in Netlify using Netlify CLI and bash."
summary: Quick, operational instructions and scripts to accelerate creating, deploying, managing, and deleting applications in Netlify using CLI and local bash tools.
---

# Quickstart

- Requirements: `netlify` CLI installed. Log in: `netlify login`.
- Test: `netlify status` should show linked site or none.
- Example: Create site, deploy static page, manage env vars, delete.

## CLI Installation

See installation documentation: https://docs.netlify.com/cli/get-started/

Example for Linux/macOS: `npm install -g netlify-cli`

Or via Homebrew: `brew install netlify-cli`

## Tworzenie site'u

### Nowy site z promptem
```bash
netlify create "My Static Site"
```

### Linking to existing repo (continuous deployment)
```bash
netlify init
```

### Manual linking
```bash
netlify link
```

## Preparing an example

Create a simple static site project in the `examples/netlify-example/` directory:

- `index.html`
- `styles.css`
- `netlify.toml` (important for static sites!)

Example `netlify.toml` for static site:

```toml
[build]
  publish = "."
  command = ""
```

This ensures Netlify publishes files directly without a build command.

Example `index.html`:
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

### Manual deployment
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
After `netlify init`, every push to the repo automatically deploys.

## Managing aspects

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
If the project has functions in `netlify/functions/`:
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
Configure custom domains through UI: Sites > [site] > Domain management.

## Deleting a site

### Via CLI
```bash
# Check list of sites
netlify sites:list

# Delete by ID
netlify sites:delete <SITE_ID>

# Delete without prompt
netlify sites:delete <SITE_ID> --force
```

**Note:** This permanently deletes the site, all deploys, env vars, functions, etc.

### Alternative via UI
If you prefer UI: Sites > [site] > Site settings > Danger zone > Delete site.

## `scripts/netlify.sh` helper

See `scripts/netlify.sh` in the repo — contains functions: `create-site`, `deploy-example`, `set-env`, `cleanup`.

## Example of full cycle
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

## Security and environment
- Store secrets in env vars, not in code.
- Use personal access tokens for CI: https://app.netlify.com/user/applications#personal-access-tokens
- Disable public access to drafts if sensitive.

## FAQ / common errors
- 401: Check login `netlify login`.
- Build fails: Check `netlify.toml` and build settings.
- Functions not deploying: Make sure `node_modules` are installed.

## Verification / Quick checks
- `netlify status` — site status
- `netlify sites:list` — list of sites
- `netlify env:list` — list of env vars

## References
- Netlify CLI docs: https://docs.netlify.com/cli/get-started/
- `netlify --help` — local CLI documentation