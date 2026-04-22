import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, test } from 'node:test';
import { createServer } from '../bin/mcp.mjs';

function createTempHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'web-ui-skills-mcp-test-'));
}

function runInlineModule(code, env = {}) {
  return execFileSync(process.execPath, ['--input-type=module', '-e', code], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function mcpFileUrl() {
  return new URL('../bin/mcp.mjs', import.meta.url).href;
}

describe('installer', () => {
  test('installs a predefined group into a selected tool scope', () => {
    const home = createTempHome();
    const moduleUrl = mcpFileUrl();

    const installOutput = runInlineModule(
      `
        import { installOrUpdate } from ${JSON.stringify(moduleUrl)};
        const result = installOrUpdate({
          mode: 'install',
          tools: ['codex'],
          groups: ['ui'],
        });
        console.log(result.content[0].text);
      `,
      { CODEX_HOME: home },
    );

    assert.match(installOutput, /"ok": true/);
    assert.ok(fs.existsSync(path.join(home, 'skills', 'preact-ui', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(home, 'skills', 'vue-ui', 'SKILL.md')));
  });
});

describe('client context', () => {
  test('tags tool responses with the active client name', () => {
    const home = createTempHome();
    const moduleUrl = mcpFileUrl();

    const output = runInlineModule(
      `
        import { installOrUpdate } from ${JSON.stringify(moduleUrl)};
        const result = installOrUpdate({
          mode: 'install',
          tools: ['codex'],
          groups: ['ui'],
          context: { client: 'codex' },
        });
        console.log(result.content[0].text);
      `,
      { CODEX_HOME: home },
    );

    assert.match(output, /"client": "codex"/);
  });
});

describe('prompts', () => {
  test('registers guidance prompts', () => {
    const server = createServer();

    assert.ok(server._registeredPrompts['how-to-use-web-ui-skills']);
    assert.ok(server._registeredPrompts['install-group-plan']);
    assert.ok(server._registeredPrompts['update-skills-plan']);
    assert.ok(server._registeredPrompts['remove-skills-plan']);
  });
});

describe('removal', () => {
  test('removes every installed skill in one tool scope', () => {
    const home = createTempHome();
    const moduleUrl = mcpFileUrl();

    runInlineModule(
      `
        import { installOrUpdate } from ${JSON.stringify(moduleUrl)};
        const result = installOrUpdate({
          mode: 'install',
          tools: ['codex'],
          groups: ['ui'],
        });
        console.log(result.content[0].text);
      `,
      { CODEX_HOME: home },
    );

    const removeOutput = runInlineModule(
      `
        import { removeSkillSelection } from ${JSON.stringify(moduleUrl)};
        const result = removeSkillSelection({
          tools: ['codex'],
          allSkills: true,
        });
        console.log(result.content[0].text);
      `,
      { CODEX_HOME: home },
    );

    assert.match(removeOutput, /"allSkills": true/);
    assert.ok(!fs.existsSync(path.join(home, 'skills', 'preact-ui')));
    assert.ok(!fs.existsSync(path.join(home, 'skills', 'vue-ui')));
  });
});

describe('scope validation', () => {
  test('rejects missing tool scope for remove', () => {
    const moduleUrl = mcpFileUrl();

    const output = runInlineModule(
      `
        import { removeSkillSelection } from ${JSON.stringify(moduleUrl)};
        const result = removeSkillSelection({
          allSkills: true,
        });
        console.log(result.content[0].text);
      `,
    );

    assert.match(output, /Provide at least one tool/);
  });
});
