# XSS prevention

- Prefer escaping over raw HTML insertion.
- Sanitize only when rich text is required.
- Do not trust markdown, CMS content, or user profile fields by default.
- Avoid executing strings as code.
