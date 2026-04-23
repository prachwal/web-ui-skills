const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { describe, test } = require('node:test');

const installer = require('../bin/install.js');

const script = path.resolve(__dirname, '../bin/install.js');
process.env.WEB_UI_SKILLS_USER_SOURCE = path.join(os.tmpdir(), 'web-ui-skills-test-empty-user-source');

function createTempHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'web-ui-skills-test-'));
}

function writeSkill(dir, name, description) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'SKILL.md'),
    `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n`,
  );
}

function createOverlaySource(root = createTempHome()) {
  const overlay = path.join(root, '.web-ui-skills', 'skills');

  writeSkill(
    path.join(overlay, 'preact-ui'),
    'preact-ui',
    'Use when working with the local overlay Preact skill.',
  );
  writeSkill(
    path.join(overlay, 'private-ui'),
    'private-ui',
    'Use when working with private local UI patterns.',
  );

  fs.writeFileSync(
    path.join(overlay, 'groups.json'),
    JSON.stringify(
      {
        ui: {
          description: 'Local UI overlays and private UI patterns.',
          skills: ['preact-ui', 'private-ui'],
        },
      },
      null,
      2,
    ),
  );

  return overlay;
}

function createProjectOverlaySource(projectRoot = createTempHome()) {
  return createOverlaySource(projectRoot);
}

function runCli(args, env = {}, cwd = process.cwd()) {
  return execFileSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
    cwd,
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

  test('recognizes the mcp command', () => {
    const parsed = installer.parseArgs(['mcp']);

    assert.equal(parsed.command, 'mcp');
  });

  test('recognizes project installs', () => {
    const parsed = installer.parseArgs(['--project', '--project-root', '/tmp/project', '--codex']);

    assert.equal(parsed.project, true);
    assert.equal(parsed.projectRoot, '/tmp/project');
    assert.deepEqual(parsed.requestedTools, ['codex']);
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
    assert.deepEqual(groups.ui.skills, ['preact-ui', 'vue-ui', 'vue-router', 'scss-system', 'storybook-ui']);
  });

  test('merges user overlay sources on top of bundled skills', () => {
    installer.invalidateCache();
    const overlay = createOverlaySource();
    const sources = [installer.getSkillsSource(), overlay];

    const detail = installer.getSkillDetail('preact-ui', sources);
    const groups = installer.loadSkillGroups(sources);
    const allSkills = installer.getAllSkillDetails(sources).map((skill) => skill.folder);

    assert.ok(detail);
    assert.equal(detail.description, 'Use when working with the local overlay Preact skill.');
    assert.equal(detail.path, path.join(overlay, 'preact-ui'));
    assert.equal(groups.ui.description, 'Local UI overlays and private UI patterns.');
    assert.deepEqual(groups.ui.skills, ['preact-ui', 'private-ui']);
    assert.ok(allSkills.includes('private-ui'));
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

  test('removes all installed skills from all tool directories when explicitly requested', () => {
    const home = createTempHome();
    const env = {
      CODEX_HOME: path.join(home, 'codex'),
      CLAUDE_HOME: path.join(home, 'claude'),
      COPILOT_HOME: path.join(home, 'copilot'),
      KILOCODE_HOME: path.join(home, 'kilo'),
    };

    runCli(['--codex', '--claude', '--copilot', '--kilo', 'preact-ui', 'vue-ui'], env);

    assert.ok(fs.existsSync(path.join(env.CODEX_HOME, 'skills', 'preact-ui', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(env.CLAUDE_HOME, 'skills', 'vue-ui', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(env.COPILOT_HOME, 'skills', 'preact-ui', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(env.KILOCODE_HOME, 'skills', 'vue-ui', 'SKILL.md')));

    runCli(['remove', '--all', '--everything'], env);

    assert.ok(!fs.existsSync(path.join(env.CODEX_HOME, 'skills', 'preact-ui')));
    assert.ok(!fs.existsSync(path.join(env.CLAUDE_HOME, 'skills', 'vue-ui')));
    assert.ok(!fs.existsSync(path.join(env.COPILOT_HOME, 'skills', 'preact-ui')));
    assert.ok(!fs.existsSync(path.join(env.KILOCODE_HOME, 'skills', 'vue-ui')));
  });

  test('installs a predefined group via --group', () => {
    const home = createTempHome();

    runCli(['--codex', '--group', 'ui'], { CODEX_HOME: home });

    assert.ok(fs.existsSync(path.join(home, 'skills', 'preact-ui', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(home, 'skills', 'vue-ui', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(home, 'skills', 'vue-router', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(home, 'skills', 'scss-system', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(home, 'skills', 'storybook-ui', 'SKILL.md')));
  });

  test('installs overlay skills from the user source when present', () => {
    const home = createTempHome();
    const overlay = createOverlaySource();
    const env = {
      CODEX_HOME: home,
      WEB_UI_SKILLS_USER_SOURCE: overlay,
    };

    runCli(['--codex', '--group', 'ui'], env);

    assert.ok(fs.existsSync(path.join(home, 'skills', 'preact-ui', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(home, 'skills', 'private-ui', 'SKILL.md')));
    assert.match(
      fs.readFileSync(path.join(home, 'skills', 'preact-ui', 'SKILL.md'), 'utf8'),
      /local overlay Preact skill/,
    );
  });

  test('installs project overlay skills from the current project when present', () => {
    const projectRoot = createTempHome();
    createProjectOverlaySource(projectRoot);

    runCli(['--project', '--codex', '--group', 'ui'], {}, projectRoot);

    assert.ok(fs.existsSync(path.join(projectRoot, '.codex', 'skills', 'preact-ui', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(projectRoot, '.codex', 'skills', 'private-ui', 'SKILL.md')));
    assert.match(
      fs.readFileSync(path.join(projectRoot, '.codex', 'skills', 'preact-ui', 'SKILL.md'), 'utf8'),
      /local overlay Preact skill/,
    );
  });

  test('installs skills into a project-local tool directory', () => {
    const projectRoot = createTempHome();

    runCli(['--project', '--codex', 'preact-ui', 'vue-ui'], {}, projectRoot);

    assert.ok(fs.existsSync(path.join(projectRoot, '.codex', 'skills', 'preact-ui', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(projectRoot, '.codex', 'skills', 'vue-ui', 'SKILL.md')));
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

  test('remove --all without everything is rejected', () => {
    assert.throws(() => {
      runCli(['remove', '--all']);
    }, /Remove all tool scopes requires at least one skill\/group name or --everything/);
  });

  test('rejects unknown flags', () => {
    assert.throws(() => {
      runCli(['--mystery']);
    }, /Unknown option\(s\): --mystery/);
  });

  test('starts the local MCP server command without mutating other state', () => {
    const originalSpawnSync = installer.__test__.spawnSync;
    let called = false;

    installer.__test__.spawnSync = (...args) => {
      called = true;
      assert.ok(args[1][0].endsWith(path.join('bin', 'mcp.mjs')));
      return { status: 0 };
    };

    try {
      assert.equal(installer.runMcpServer(), 0);
      assert.equal(called, true);
    } finally {
      installer.__test__.spawnSync = originalSpawnSync;
    }
  });
});
