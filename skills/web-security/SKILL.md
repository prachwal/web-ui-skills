---
name: web-security
description: Use when implementing or reviewing frontend security concerns in web apps, including XSS prevention, safe rendering, CSP, CSRF awareness, token handling, secure storage, and secure links/forms.
---

# Web Security Skill

Use this skill when a web UI touches untrusted input, authentication, session state, tokens, redirects, uploads, or any browser-exposed security boundary.

## Core principles

1. Treat all external input as untrusted.
2. Prefer safe defaults in the framework and browser.
3. Minimize the amount of raw HTML, script execution, and privileged data exposed to the client.
4. Assume security mistakes often look like convenience shortcuts.
5. Validate, encode, and constrain data as close to the boundary as possible.
6. Do not weaken accessibility or usability while tightening security.

## Workflow

1. Identify the trust boundaries: user input, auth/session, API responses, third-party embeds, file uploads, redirects.
2. Look for dangerous sinks: raw HTML injection, `eval`-like behavior, unsafe URL construction, inline script injection, insecure DOM APIs.
3. Prefer framework-safe rendering and explicit escaping/sanitization.
4. Keep secrets out of browser storage when possible; avoid exposing tokens to unnecessary code paths.
5. Check auth-sensitive flows for CSRF, clickjacking, and open redirect risks.
6. Verify CSP, same-origin assumptions, and cookie attributes when applicable.
7. Review the change for exploitability, not just correctness.

## Practical rules

- Avoid raw `innerHTML` unless the content is sanitized and the use case is unavoidable.
- Never interpolate untrusted data into script contexts, event handlers, or URLs without encoding and validation.
- Prefer `HttpOnly`, `Secure`, and `SameSite` cookies for session material when the architecture allows it.
- Keep CSRF protections in place for state-changing requests.
- Use a restrictive Content Security Policy where feasible.
- Validate redirect targets against an allowlist.
- Sanitize uploaded filenames, MIME assumptions, and preview rendering.
- Treat third-party widgets and embeds as untrusted.

## References

- [references/xss.md](references/xss.md)
- [references/session-and-storage.md](references/session-and-storage.md)
- [references/csp-and-headers.md](references/csp-and-headers.md)
