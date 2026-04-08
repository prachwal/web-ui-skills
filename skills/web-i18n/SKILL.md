---
name: web-i18n
description: Use when building or reviewing internationalized web UIs, including locale-aware formatting, language tags, directionality, RTL layouts, pluralization, and translatable copy.
---

# Web Internationalization Skill

Use this skill when a UI must work across languages, locales, scripts, and text directions.

## Core principles

1. Separate user-facing text from code.
2. Set language and direction explicitly.
3. Format dates, numbers, currencies, and plurals with locale-aware APIs.
4. Assume strings can expand, shrink, or switch direction.
5. Design for RTL as a first-class layout, not a patch.
6. Avoid text embedded in images or hard-coded formatting assumptions.

## Workflow

1. Identify the supported locales and writing directions.
2. Mark the document and content with correct `lang` values.
3. Set `dir` where direction changes or RTL is supported.
4. Externalize strings and keep placeholders stable for translators.
5. Use `Intl` for formatting, not manual string assembly.
6. Test long translations, plural forms, and mixed-direction content.
7. Verify that layout, truncation, and icons still read correctly in RTL.

## Practical rules

- Use BCP 47 language tags in `lang`.
- Use `dir="rtl"` for RTL documents or subtrees when needed.
- Prefer `Intl.DateTimeFormat`, `Intl.NumberFormat`, and `Intl.PluralRules`.
- Keep dates, times, and numbers locale-sensitive.
- Avoid using punctuation, order, or word forms that only make sense in English.
- Check that spacing, alignment, and icons mirror correctly in RTL.
- Be careful with bidi text, user names, and mixed-script strings.

## References

- [references/lang-dir.md](references/lang-dir.md)
- [references/intl-formatting.md](references/intl-formatting.md)
- [references/plurals.md](references/plurals.md)
