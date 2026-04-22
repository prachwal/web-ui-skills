const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { describe, test } = require('node:test');

const installer = require('../bin/install.js');

const script = path.resolve(__dirname, '../bin/install.js');

function createTempHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'web-ui-skills-test-'));
}

function runCli(args, env = {}) {
  return execFileSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

describe('parser', () => {
  test('recognizes commands, tools, and positional skills', () => {
    const parsed = installer.parseArgs(['remove', '--codex', 'vue-ui', '--all']);

    assert.equal(parsed.command, 'remove');
    assert.equal(parsed.deleteMode, false);
    assert.equal(parsed.all, true);
    assert.deepEqual(parsed.requestedTools, ['codex']);
    assert.deepEqual(parsed.selectedSkills, ['vue-ui']);
  });

  test('recognizes group installs', () => {
    const parsed = installer.parseArgs(['group', 'ui']);

    assert.equal(parsed.command, 'group');
    assert.deepEqual(parsed.selectedGroups, ['ui']);
    assert.deepEqual(parsed.selectedSkills, []);
  });

  test('resolves selected skills by folder name', () => {
    const skills = installer.getTopLevelSkills();
    const resolved = installer.filterSelectedSkills(skills, ['preact-ui', 'vue-ui']);

    assert.deepEqual(resolved, ['preact-ui', 'vue-ui']);
  });

  test('rejects unknown skill names', () => {
    const skills = installer.getTopLevelSkills();

    assert.equal(installer.filterSelectedSkills(skills, ['missing-skill']), null);
  });
});

describe('discovery', () => {
  test('searchSkills matches by folder and frontmatter name', () => {
    const matches = installer.searchSkills('ui').map((skill) => skill.dir);

    assert.ok(matches.includes('preact-ui'));
    assert.ok(matches.includes('vue-ui'));
    assert.ok(matches.includes('frontend-ui'));
  });

  test('loadSkillGroups exposes predefined groups', () => {
    const groups = installer.loadSkillGroups();

    assert.ok(groups.ui);
    assert.deepEqual(groups.ui.skills, ['preact-ui', 'vue-ui', 'scss-system', 'storybook-ui']);
  });
});

describe('cli integration', () => {
  test('installs and removes selected skills in a temp home directory', () => {
    const home = createTempHome();

    runCli(['--codex', 'preact-ui', 'vue-ui'], { CODEX_HOME: home });

    assert.ok(fs.existsSync(path.join(home, 'skills', 'preact-ui', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(home, 'skills', 'vue-ui', 'SKILL.md')));

    runCli(['--codex', 'remove', 'vue-ui'], { CODEX_HOME: home });

    assert.ok(fs.existsSync(path.join(home, 'skills', 'preact-ui', 'SKILL.md')));
    assert.ok(!fs.existsSync(path.join(home, 'skills', 'vue-ui')));
  });

  test('installs a predefined group via --group', () => {
    const home = createTempHome();

    runCli(['--codex', '--group', 'ui'], { CODEX_HOME: home });

    assert.ok(fs.existsSync(path.join(home, 'skills', 'preact-ui', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(home, 'skills', 'vue-ui', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(home, 'skills', 'scss-system', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(home, 'skills', 'storybook-ui', 'SKILL.md')));
  });

  test('lists predefined groups', () => {
    const output = runCli(['groups']);

    assert.match(output, /Available groups:/);
    assert.match(output, /ui/);
    assert.match(output, /foundation/);
  });
});

describe('safety', () => {
  test('remove requires an explicit tool scope', () => {
    assert.throws(() => {
      runCli(['remove', 'vue-ui']);
    }, /Use at least one tool flag/);
  });
});
