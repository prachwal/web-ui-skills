# Skills Review (2026-04-16)

This review summarizes candidate updates after checking vendor/official docs (Netlify, Neon, W3C, GitHub Docs).

## Applied in this commit

1. **Copilot guidance adjusted**
   - Replaced broad statement about "automatic loading in VS Code" with repository-visible instructions guidance (`.github/copilot-instructions.md`), which is easier to keep deterministic in team repos.

2. **Neon + Node compatibility wording updated**
   - Updated transaction example comment from "Node 18+" to "Node.js v21 and below" for the `webSocketConstructor` override.

3. **Netlify Edge limits guidance made future-proof**
   - Replaced hard-coded values in the skill body with instruction to verify current limits in Netlify docs before relying on them.
   - Updated rate limiting link to the current docs path.

## Proposed next updates (not yet implemented)

1. **Add a periodic "docs freshness" checklist**
   - Add a monthly/quarterly check script or issue template that validates external links and high-volatility claims (runtime limits, Node/runtime versions, platform feature availability).

2. **Versioned claims in skill references**
   - For volatile constraints, include a line like:
     - "Verified against vendor docs on YYYY-MM-DD"
     - "Re-verify before production rollout"

3. **Copilot-specific skill examples**
   - Add a small reference file that shows practical `copilot-instructions.md` patterns (architecture constraints, test policy, accessibility checklist) to improve portability.

4. **Netlify runtime matrix reference**
   - Add a short table in `netlify-serverless` references covering when to use Functions vs Edge vs Background vs Scheduled + operational limits and caveats.

## Sources checked

- Netlify docs: Scheduled Functions, Edge Functions/API/limits, rate limiting pages.
- Neon serverless driver docs/readme guidance on `Pool`/transactions and Node runtime behavior.
- W3C WCAG 2.2 recommendation materials.
- GitHub Docs for Copilot instructions context.
