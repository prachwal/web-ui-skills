# Debugging Vercel functions and runtime errors

Common failure modes and how to diagnose them:

- `FUNCTION_INVOCATION_FAILED` — check function logs in the Vercel dashboard. Typical causes:
  - Unhandled exception in handler (inspect stacktrace)
  - Missing runtime dependency or failing third-party API call

- `ERR_MODULE_NOT_FOUND` — likely due to emitted import paths:
  - Verify that helper modules are present in the built function bundle.
  - Ensure imports resolved at runtime use the correct extension (e.g., `.js`) if your bundler emits `.js` files.

- API endpoints returning HTML (SPA shell) — usually a rewrite trap. Verify `vercel.json` rewrites and `curl` the `/api/...` URL directly.

Debugging workflow:

1. Reproduce locally with `vercel dev` and check terminal output.
2. Deploy a preview and open Vercel's Function logs for the failing invocation.
3. Use `curl -v` against the deployed endpoint to inspect status code and headers.
4. Confirm that build output (`dist/`) contains expected helper files; adjust bundler output or import specifiers when mismatches occur.
