---
name: release-docs
description: Use when updating release notes, README content, changelogs, deployment instructions, environment documentation, version notes, or repo maintenance docs for software releases.
---

# Release Docs

Use this skill for release-facing and repository documentation.

## Repo Fit

- Prefer updating existing Markdown files over creating new ones.
- Keep repository documentation consolidated unless splitting clearly improves navigation.
- Keep README focused on what a developer needs to install, configure, build, test, run, and deploy.
- Keep deployment docs aligned with actual package scripts.
- For this repo, keep Vercel output references aligned with root `dist/`.

## Documentation Workflow

- Read the existing README and package scripts before changing docs.
- Verify command names against `package.json`.
- Verify env variable names against `.env.example`, Vite config, server code, and frontend declarations.
- Update docs in the same change that changes behavior, scripts, envs, deploy flow, or public contracts.
- Prefer short task-oriented bullets over long prose.
- Remove stale instructions instead of adding contradictory notes.

## Release Notes

- If maintaining a changelog, use an `Unreleased` section at the top.
- Group notable changes by type: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
- Write for humans, not as a raw commit log.
- Keep latest releases first.
- Use ISO dates: `YYYY-MM-DD`.
- Link versions or deployment references when the repo has a stable release/tag convention.

## Versioning

- Use semantic versioning when the project exposes a meaningful public API.
- Increment `MAJOR` for incompatible public API changes.
- Increment `MINOR` for backward-compatible functionality.
- Increment `PATCH` for backward-compatible fixes.
- For private apps, document user-visible deployment changes even when package version stays `0.0.0`.

## README Content

- Keep these sections accurate when relevant: project purpose, local setup, env setup, scripts, testing, build, deploy, and architecture notes.
- Mention only supported flows; remove dead setup paths.
- Use copy-pastable commands but avoid duplicating every obvious npm script.
- Keep badges and live deployment links current.
- Do not paste generated API docs into README; link or regenerate them through the existing docs command.

## Deployment Docs

- Document required env files and where secrets live.
- Distinguish frontend `VITE_` values from server-only secrets.
- Include local, preview, and production deploy commands only if they are actually supported.
- Note when a command syncs remote env vars or deploys to production.
- Keep rollback or promotion steps explicit if the repo uses them.

## Verification

- Run `npm run build` when docs claim a build/deploy path works and code changed.
- Run `npm test` when release notes mention tested behavior or bug fixes.
- For docs-only changes, verify links, commands, and paths by reading the referenced files.
