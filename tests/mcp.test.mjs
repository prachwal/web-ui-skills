import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, test } from 'node:test';
import { createServer, installOrUpdate, removeSkillSelection, resolveServerContext } from '../bin/mcp.mjs';

process.env.WEB_UI_SKILLS_USER_SOURCE = path.join(os.tmpdir(), 'web-ui-skills-test-empty-user-source');

function createTempHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'web-ui-skills-mcp-test-'));
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

async function importFreshMcp() {
  const url = new URL('../bin/mcp.mjs', import.meta.url);
  url.search = `v=${Date.now()}-${Math.random()}`;
  return import(url.href);
}

describe('installer', () => {
  test('installs a predefined group into a selected tool scope', () => {
    const projectRoot = createTempHome();
    const result = installOrUpdate({
      mode: 'install',
      tools: ['codex'],
      groups: ['ui'],
      project: true,
      projectRoot,
    });
    const payload = JSON.parse(result.content[0].text);

    assert.equal(payload.ok, true);
    assert.equal(payload.mode, 'install');
    assert.equal(payload.project, true);
    assert.ok(fs.existsSync(path.join(projectRoot, '.codex', 'skills', 'preact-ui', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(projectRoot, '.codex', 'skills', 'vue-ui', 'SKILL.md')));
  });

  test('installs a predefined group into a project-local tool scope', () => {
    const projectRoot = createTempHome();
    const result = installOrUpdate({
      mode: 'install',
      tools: ['codex'],
      groups: ['ui'],
      project: true,
      projectRoot,
    });
    const payload = JSON.parse(result.content[0].text);

    assert.equal(payload.project, true);
    assert.ok(fs.existsSync(path.join(projectRoot, '.codex', 'skills', 'preact-ui', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(projectRoot, '.codex', 'skills', 'vue-ui', 'SKILL.md')));
  });
});

describe('client context', () => {
  test('reads project-local defaults from environment', () => {
    const originalProject = process.env.WEB_UI_SKILLS_PROJECT;
    const originalProjectRoot = process.env.WEB_UI_SKILLS_PROJECT_ROOT;
    const projectRoot = createTempHome();

    process.env.WEB_UI_SKILLS_PROJECT = 'true';
    process.env.WEB_UI_SKILLS_PROJECT_ROOT = projectRoot;

    try {
      const context = resolveServerContext();

      assert.equal(context.project, true);
      assert.equal(context.projectRoot, projectRoot);
    } finally {
      if (originalProject === undefined) {
        delete process.env.WEB_UI_SKILLS_PROJECT;
      } else {
        process.env.WEB_UI_SKILLS_PROJECT = originalProject;
      }

      if (originalProjectRoot === undefined) {
        delete process.env.WEB_UI_SKILLS_PROJECT_ROOT;
      } else {
        process.env.WEB_UI_SKILLS_PROJECT_ROOT = originalProjectRoot;
      }
    }
  });

  test('uses context project defaults when install input omits project fields', () => {
    const projectRoot = createTempHome();
    const result = installOrUpdate({
      mode: 'install',
      tools: ['codex'],
      skills: ['docs-instructions'],
      context: {
        client: 'codex',
        project: true,
        projectRoot,
      },
    });
    const payload = JSON.parse(result.content[0].text);

    assert.equal(payload.project, true);
    assert.ok(fs.existsSync(path.join(projectRoot, '.codex', 'skills', 'docs-instructions', 'SKILL.md')));
  });

  test('tags tool responses with the active client name', () => {
    const projectRoot = createTempHome();
    const result = installOrUpdate({
      mode: 'install',
      tools: ['codex'],
      groups: ['ui'],
      context: { client: 'codex', project: true, projectRoot },
    });
    const payload = JSON.parse(result.content[0].text);

    // client field is removed by response pruning to reduce token usage
    assert.equal(payload.ok, true);
    assert.equal(payload.mode, 'install');
    assert.equal(payload.client, undefined);
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

describe('overlay tools', { concurrency: false }, () => {
  test('uses consistent snake_case MCP tool names', () => {
    const server = createServer();
    const toolNames = Object.keys(server._registeredTools).sort();

    assert.ok(toolNames.every((name) => /^[a-z]+(?:_[a-z]+)*$/.test(name)));
    assert.ok(toolNames.includes('list_overlays'));
    assert.ok(toolNames.includes('sync_overlays'));
    assert.ok(toolNames.includes('promote_skill'));
    assert.ok(toolNames.includes('get_skill_info'));
    assert.ok(toolNames.includes('get_group_info'));
    assert.ok(toolNames.includes('list_skills_info'));
  });

  test('lists repo, user, and project overlay sources', async () => {
    const server = createServer();
    const projectRoot = createTempHome();
    const projectOverlay = path.join(projectRoot, '.web-ui-skills', 'skills');
    fs.mkdirSync(projectOverlay, { recursive: true });
    fs.writeFileSync(
      path.join(projectOverlay, 'groups.json'),
      JSON.stringify(
        {
          ui: {
            description: 'Project overlay UI group.',
            skills: ['preact-ui'],
          },
        },
        null,
        2,
      ),
    );

    const result = await server._registeredTools.list_overlays.handler({
      project: true,
      projectRoot,
    });
    const payload = JSON.parse(result.content[0].text);

    assert.equal(payload.overlays.project, true);
    assert.equal(payload.overlays.projectRoot, projectRoot);
    assert.equal(payload.overlays.sources.length, 3);
    assert.deepEqual(payload.overlays.precedence, ['repo', 'user', 'project']);
    assert.ok(payload.overlays.sources.some((source) => source.scope === 'repo' && source.exists));
    assert.ok(payload.overlays.sources.some((source) => source.scope === 'project' && source.exists));
    assert.ok(payload.overlays.merged.skills.includes('preact-ui'));
  });

  test('syncs merged overlays into the project overlay directory', async () => {
    const originalUserSource = process.env.WEB_UI_SKILLS_USER_SOURCE;
    const userOverlayRoot = createOverlaySource();
    const projectRoot = createTempHome();
    const server = createServer();

    process.env.WEB_UI_SKILLS_USER_SOURCE = userOverlayRoot;

    try {
      const result = await server._registeredTools.sync_overlays.handler({
        target: 'project',
        projectRoot,
      });
      const payload = JSON.parse(result.content[0].text);

      assert.equal(payload.sync.target, 'project');
      assert.ok(fs.existsSync(path.join(projectRoot, '.web-ui-skills', 'skills', 'private-ui', 'SKILL.md')));
      assert.match(
        fs.readFileSync(path.join(projectRoot, '.web-ui-skills', 'skills', 'preact-ui', 'SKILL.md'), 'utf8'),
        /local overlay Preact skill/,
      );
    } finally {
      if (originalUserSource === undefined) {
        delete process.env.WEB_UI_SKILLS_USER_SOURCE;
      } else {
        process.env.WEB_UI_SKILLS_USER_SOURCE = originalUserSource;
      }
    }
  });

  test('promotes a single project-local skill into the user overlay directory', async () => {
    const originalUserSource = process.env.WEB_UI_SKILLS_USER_SOURCE;
    const userOverlayRoot = createTempHome();
    const projectRoot = createTempHome();
    const projectOverlay = path.join(projectRoot, '.web-ui-skills', 'skills');
    fs.mkdirSync(projectOverlay, { recursive: true });
    fs.mkdirSync(path.join(projectOverlay, 'private-ui'), { recursive: true });
    fs.writeFileSync(
      path.join(projectOverlay, 'private-ui', 'SKILL.md'),
      '---\nname: private-ui\ndescription: Private project skill.\n---\n\n# private-ui\n',
    );
    const server = createServer();

    process.env.WEB_UI_SKILLS_USER_SOURCE = path.join(userOverlayRoot, '.web-ui-skills', 'skills');

    try {
      const result = await server._registeredTools.promote_skill.handler({
        name: 'private-ui',
        projectRoot,
      });
      const payload = JSON.parse(result.content[0].text);

      assert.equal(payload.promote.ok, true);
      assert.ok(fs.existsSync(path.join(userOverlayRoot, '.web-ui-skills', 'skills', 'private-ui', 'SKILL.md')));
    } finally {
      if (originalUserSource === undefined) {
        delete process.env.WEB_UI_SKILLS_USER_SOURCE;
      } else {
        process.env.WEB_UI_SKILLS_USER_SOURCE = originalUserSource;
      }
    }
  });
});

describe('mcp surface', { concurrency: false }, () => {
  test('supports tools, prompts, resources, and tool calls in process', async () => {
    const projectRoot = createTempHome();
    const userOverlay = createOverlaySource();
    const originalClient = process.env.WEB_UI_SKILLS_CLIENT;
    const originalUserSource = process.env.WEB_UI_SKILLS_USER_SOURCE;
    const originalHome = process.env.CODEX_HOME;

    process.env.WEB_UI_SKILLS_CLIENT = 'codex';
    process.env.WEB_UI_SKILLS_USER_SOURCE = userOverlay;
    process.env.CODEX_HOME = createTempHome();
    const server = createServer({ client: 'codex' });

    try {
      const toolNames = Object.keys(server._registeredTools);
      assert.ok(toolNames.includes('search_skills'));
      assert.ok(toolNames.includes('list_overlays'));
      assert.ok(toolNames.includes('sync_overlays'));
      assert.ok(toolNames.includes('promote_skill'));

      assert.ok(server._registeredPrompts['how-to-use-web-ui-skills']);
      assert.ok(server._registeredPrompts['install-group-plan']);

      const guide = server._registeredResources['web-ui-skills://guide'];
      assert.ok(guide);
      const guideResult = await guide.readCallback(new URL('web-ui-skills://guide'));
      assert.match(
        guideResult.contents[0].text,
        /Use list_overlays to inspect repo, user, and project sources and precedence/,
      );

      const overlayResult = await server._registeredTools.list_overlays.handler({
        project: true,
        projectRoot,
      });
      const overlayPayload = JSON.parse(overlayResult.content[0].text);
      assert.equal(overlayPayload.overlays.project, true);
      assert.ok(overlayPayload.overlays.merged.skills.includes('private-ui'));

      const skillInfo = await server._registeredTools.get_skill_info.handler({
        name: 'preact-ui',
      });
      const skillPayload = JSON.parse(skillInfo.content[0].text);
      assert.equal(skillPayload.skill.name, 'preact-ui');

      const groupInfo = await server._registeredTools.get_group_info.handler({
        name: 'ui',
      });
      const groupPayload = JSON.parse(groupInfo.content[0].text);
      assert.equal(groupPayload.group.name, 'ui');

      const listSkills = await server._registeredTools.list_skills_info.handler({});
      const listSkillsPayload = JSON.parse(listSkills.content[0].text);
      assert.ok(listSkillsPayload.skills.some((skill) => skill.name === 'preact-ui'));

      const syncResult = await server._registeredTools.sync_overlays.handler({
        target: 'project',
        projectRoot,
      });
      const syncPayload = JSON.parse(syncResult.content[0].text);
      assert.equal(syncPayload.sync.target, 'project');
      assert.ok(fs.existsSync(path.join(projectRoot, '.web-ui-skills', 'skills', 'private-ui', 'SKILL.md')));

      const promoteResult = await server._registeredTools.promote_skill.handler({
        name: 'private-ui',
        projectRoot,
      });
      const promotePayload = JSON.parse(promoteResult.content[0].text);
      assert.equal(promotePayload.promote.ok, true);
      assert.ok(fs.existsSync(path.join(userOverlay, 'private-ui', 'SKILL.md')));
    } finally {
      if (originalClient === undefined) {
        delete process.env.WEB_UI_SKILLS_CLIENT;
      } else {
        process.env.WEB_UI_SKILLS_CLIENT = originalClient;
      }
      if (originalUserSource === undefined) {
        delete process.env.WEB_UI_SKILLS_USER_SOURCE;
      } else {
        process.env.WEB_UI_SKILLS_USER_SOURCE = originalUserSource;
      }
      if (originalHome === undefined) {
        delete process.env.CODEX_HOME;
      } else {
        process.env.CODEX_HOME = originalHome;
      }
    }
  });
});

describe('skill info tools', { concurrency: false }, () => {
  test('returns detailed info for one skill', async () => {
    const originalUserSource = process.env.WEB_UI_SKILLS_USER_SOURCE;
    const emptyUserSource = createTempHome();
    process.env.WEB_UI_SKILLS_USER_SOURCE = emptyUserSource;

    try {
    const server = createServer();
    const result = await server._registeredTools.get_skill_info.handler({ name: 'storybook-ui' });
    const payload = JSON.parse(result.content[0].text);

    assert.equal(payload.skill.name, 'storybook-ui');
    assert.equal(payload.skill.folder, 'storybook-ui');
    assert.match(payload.skill.description, /Storybook/);
    // path field is removed by response pruning to reduce token usage
    assert.equal(payload.skill.path, undefined);
    } finally {
      if (originalUserSource === undefined) {
        delete process.env.WEB_UI_SKILLS_USER_SOURCE;
      } else {
        process.env.WEB_UI_SKILLS_USER_SOURCE = originalUserSource;
      }
    }
  });

  test('returns detailed info for one group', async () => {
    const originalUserSource = process.env.WEB_UI_SKILLS_USER_SOURCE;
    const emptyUserSource = createTempHome();
    process.env.WEB_UI_SKILLS_USER_SOURCE = emptyUserSource;

    try {
    const server = createServer();
    const result = await server._registeredTools.get_group_info.handler({ name: 'foundation' });
    const payload = JSON.parse(result.content[0].text);

    assert.equal(payload.group.name, 'foundation');
    assert.equal(payload.group.description, 'Core TypeScript and tooling guidance.');
    assert.equal(payload.group.skills.length, 6);
    assert.deepEqual(
      payload.group.skills.map((skill) => skill.name),
      ['typescript-fundamentals', 'eslint-config', 'project-tooling', 'docs-instructions', 'vite-config', 'release-docs'],
    );
    // path field is removed by response pruning to reduce token usage
    assert.ok(payload.group.skills.every((skill) => skill.path === undefined));
    } finally {
      if (originalUserSource === undefined) {
        delete process.env.WEB_UI_SKILLS_USER_SOURCE;
      } else {
        process.env.WEB_UI_SKILLS_USER_SOURCE = originalUserSource;
      }
    }
  });

  test('returns detailed info for all skills', async () => {
    const server = createServer();
    const result = await server._registeredTools.list_skills_info.handler({});
    const payload = JSON.parse(result.content[0].text);

    assert.ok(Array.isArray(payload.skills));
    assert.ok(payload.skills.length > 0);
    assert.ok(payload.skills.some((skill) => skill.name === 'preact-ui'));
    // path field is removed by response pruning to reduce token usage
    assert.ok(payload.skills.every((skill) => skill.name && skill.folder && !skill.path));
  });
});

describe('skill content and reference tools', { concurrency: false }, () => {
  test('get_skill_content returns markdown body without frontmatter', async () => {
    const originalUserSource = process.env.WEB_UI_SKILLS_USER_SOURCE;
    const emptyUserSource = createTempHome();
    process.env.WEB_UI_SKILLS_USER_SOURCE = emptyUserSource;

    try {
    const server = createServer();
    const result = await server._registeredTools.get_skill_content.handler({ name: 'preact-ui' });
    const payload = JSON.parse(result.content[0].text);

    assert.equal(payload.name, 'preact-ui');
    assert.equal(typeof payload.content, 'string');
    assert.ok(payload.content.length > 0);
    assert.ok(!payload.content.startsWith('---'), 'body should not start with frontmatter delimiter');
    } finally {
      if (originalUserSource === undefined) {
        delete process.env.WEB_UI_SKILLS_USER_SOURCE;
      } else {
        process.env.WEB_UI_SKILLS_USER_SOURCE = originalUserSource;
      }
    }
  });

  test('get_skill_content returns null for unknown skill', async () => {
    const originalUserSource = process.env.WEB_UI_SKILLS_USER_SOURCE;
    const emptyUserSource = createTempHome();
    process.env.WEB_UI_SKILLS_USER_SOURCE = emptyUserSource;

    try {
    const server = createServer();
    const result = await server._registeredTools.get_skill_content.handler({ name: 'no-such-skill-xyz' });
    const payload = JSON.parse(result.content[0].text);

    // null values are omitted by response pruning
    assert.equal(payload.content, undefined);
    } finally {
      if (originalUserSource === undefined) {
        delete process.env.WEB_UI_SKILLS_USER_SOURCE;
      } else {
        process.env.WEB_UI_SKILLS_USER_SOURCE = originalUserSource;
      }
    }
  });

  test('get_skill_content works for a skill without references', async () => {
    const originalUserSource = process.env.WEB_UI_SKILLS_USER_SOURCE;
    const emptyUserSource = createTempHome();
    process.env.WEB_UI_SKILLS_USER_SOURCE = emptyUserSource;

    try {
    const server = createServer();
    const result = await server._registeredTools.get_skill_content.handler({ name: 'docs-instructions' });
    const payload = JSON.parse(result.content[0].text);

    assert.equal(payload.name, 'docs-instructions');
    assert.equal(typeof payload.content, 'string');
    assert.ok(payload.content.length > 0);
    } finally {
      if (originalUserSource === undefined) {
        delete process.env.WEB_UI_SKILLS_USER_SOURCE;
      } else {
        process.env.WEB_UI_SKILLS_USER_SOURCE = originalUserSource;
      }
    }
  });

  test('get_skill_references lists .md files for a skill with references', async () => {
    const originalUserSource = process.env.WEB_UI_SKILLS_USER_SOURCE;
    const emptyUserSource = createTempHome();
    process.env.WEB_UI_SKILLS_USER_SOURCE = emptyUserSource;

    try {
    const server = createServer();
    const result = await server._registeredTools.get_skill_references.handler({ name: 'storybook-ui' });
    const payload = JSON.parse(result.content[0].text);

    assert.equal(payload.name, 'storybook-ui');
    assert.ok(Array.isArray(payload.references));
    assert.ok(payload.references.length > 0);
    assert.ok(payload.references.every((f) => f.endsWith('.md')));
    assert.ok(payload.references.includes('setup.md'));
    // Ensure references are returned in sorted order so regressions in ordering are caught
    assert.deepEqual(payload.references, payload.references.slice().sort());
    } finally {
      if (originalUserSource === undefined) {
        delete process.env.WEB_UI_SKILLS_USER_SOURCE;
      } else {
        process.env.WEB_UI_SKILLS_USER_SOURCE = originalUserSource;
      }
    }
  });

  test('get_skill_references returns empty array for a skill with no references directory', async () => {
    const originalUserSource = process.env.WEB_UI_SKILLS_USER_SOURCE;
    const emptyUserSource = createTempHome();
    process.env.WEB_UI_SKILLS_USER_SOURCE = emptyUserSource;

    try {
    const server = createServer();
    const result = await server._registeredTools.get_skill_references.handler({ name: 'docs-instructions' });
    const payload = JSON.parse(result.content[0].text);

    assert.equal(payload.name, 'docs-instructions');
    assert.deepEqual(payload.references, []);
    } finally {
      if (originalUserSource === undefined) {
        delete process.env.WEB_UI_SKILLS_USER_SOURCE;
      } else {
        process.env.WEB_UI_SKILLS_USER_SOURCE = originalUserSource;
      }
    }
  });

  test('get_skill_references returns null for unknown skill', async () => {
    const originalUserSource = process.env.WEB_UI_SKILLS_USER_SOURCE;
    const emptyUserSource = createTempHome();
    process.env.WEB_UI_SKILLS_USER_SOURCE = emptyUserSource;

    try {
    const server = createServer();
    const result = await server._registeredTools.get_skill_references.handler({ name: 'no-such-skill-xyz' });
    const payload = JSON.parse(result.content[0].text);

    // null values are omitted by response pruning
    assert.equal(payload.references, undefined);
    } finally {
      if (originalUserSource === undefined) {
        delete process.env.WEB_UI_SKILLS_USER_SOURCE;
      } else {
        process.env.WEB_UI_SKILLS_USER_SOURCE = originalUserSource;
      }
    }
  });

  test('get_skill_references reads a specific reference file', async () => {
    const originalUserSource = process.env.WEB_UI_SKILLS_USER_SOURCE;
    const emptyUserSource = createTempHome();
    process.env.WEB_UI_SKILLS_USER_SOURCE = emptyUserSource;

    try {
    const server = createServer();
    const result = await server._registeredTools.get_skill_references.handler({
      name: 'storybook-ui',
      reference: 'setup.md',
    });
    const payload = JSON.parse(result.content[0].text);

    assert.equal(payload.name, 'storybook-ui');
    assert.equal(payload.reference, 'setup.md');
    assert.equal(typeof payload.content, 'string');
    assert.ok(payload.content.length > 0);
    } finally {
      if (originalUserSource === undefined) {
        delete process.env.WEB_UI_SKILLS_USER_SOURCE;
      } else {
        process.env.WEB_UI_SKILLS_USER_SOURCE = originalUserSource;
      }
    }
  });

  test('get_skill_references returns null for non-existent reference file', async () => {
    const server = createServer();
    const result = await server._registeredTools.get_skill_references.handler({
      name: 'preact-ui',
      reference: 'does-not-exist.md',
    });
    const payload = JSON.parse(result.content[0].text);

    // null values are omitted by response pruning
    assert.equal(payload.content, undefined);
  });

  test('get_skill_references rejects path traversal attempts', async () => {
    const server = createServer();
    const result = await server._registeredTools.get_skill_references.handler({
      name: 'preact-ui',
      reference: '../SKILL.md',
    });
    const payload = JSON.parse(result.content[0].text);

    // null values are omitted by response pruning
    assert.equal(payload.content, undefined);
  });

  test('get_skill_references rejects nested path traversal attempts', async () => {
    const server = createServer();
    const result = await server._registeredTools.get_skill_references.handler({
      name: 'preact-ui',
      reference: 'subdir/../../SKILL.md',
    });
    const payload = JSON.parse(result.content[0].text);

    // null values are omitted by response pruning
    assert.equal(payload.content, undefined);
  });

  test('search_skills includes description in results', async () => {
    const originalUserSource = process.env.WEB_UI_SKILLS_USER_SOURCE;
    const emptyUserSource = createTempHome();
    process.env.WEB_UI_SKILLS_USER_SOURCE = emptyUserSource;

    try {
    const server = createServer();
    const result = await server._registeredTools.search_skills.handler({ query: 'ui' });
    const payload = JSON.parse(result.content[0].text);

    assert.ok(Array.isArray(payload.matches));
    assert.ok(payload.matches.every((m) => typeof m.description === 'string'));
    } finally {
      if (originalUserSource === undefined) {
        delete process.env.WEB_UI_SKILLS_USER_SOURCE;
      } else {
        process.env.WEB_UI_SKILLS_USER_SOURCE = originalUserSource;
      }
    }
  });

  test('search_skills matches against description text', async () => {
    const originalUserSource = process.env.WEB_UI_SKILLS_USER_SOURCE;
    const emptyUserSource = createTempHome();
    process.env.WEB_UI_SKILLS_USER_SOURCE = emptyUserSource;

    try {
    const server = createServer();
    const result = await server._registeredTools.search_skills.handler({ query: 'storybook' });
    const payload = JSON.parse(result.content[0].text);

    assert.ok(Array.isArray(payload.matches));
    assert.ok(payload.matches.length > 0);
    const storybook = payload.matches.find((m) => m.folder === 'storybook-ui');
    assert.ok(storybook, 'storybook-ui should match because its description contains Storybook');
    } finally {
      if (originalUserSource === undefined) {
        delete process.env.WEB_UI_SKILLS_USER_SOURCE;
      } else {
        process.env.WEB_UI_SKILLS_USER_SOURCE = originalUserSource;
      }
    }
  });
});

describe('removal', () => {
  test('removes every installed skill in one tool scope', () => {
    const projectRoot = createTempHome();
    const installResult = installOrUpdate({
      mode: 'install',
      tools: ['codex'],
      groups: ['ui'],
      project: true,
      projectRoot,
    });
    assert.equal(JSON.parse(installResult.content[0].text).ok, true);

    const removeResult = removeSkillSelection({
      tools: ['codex'],
      allSkills: true,
      project: true,
      projectRoot,
    });
    const payload = JSON.parse(removeResult.content[0].text);

    assert.equal(payload.allSkills, true);
    assert.ok(!fs.existsSync(path.join(projectRoot, '.codex', 'skills', 'preact-ui')));
    assert.ok(!fs.existsSync(path.join(projectRoot, '.codex', 'skills', 'vue-ui')));
  });
});

describe('scope validation', () => {
  test('rejects missing tool scope for remove', async () => {
    const { removeSkillSelection: freshRemoveSkillSelection } = await importFreshMcp();
    const result = freshRemoveSkillSelection({
      allSkills: true,
    });
    const payload = JSON.parse(result.content[0].text);

    assert.equal(payload.ok, false);
    assert.match(payload.error, /Provide at least one tool/);
  });
});

describe('pagination', () => {
  test('list_skills_info returns paginated results with total/limit/offset', async () => {
    const server = createServer();
    const result = await server._registeredTools.list_skills_info.handler({ limit: 5, offset: 0 });
    const payload = JSON.parse(result.content[0].text);

    assert.ok(typeof payload.total === 'number' && payload.total > 0);
    assert.equal(payload.limit, 5);
    assert.equal(payload.offset, 0);
    assert.ok(Array.isArray(payload.skills));
    assert.equal(payload.skills.length, 5);
  });

  test('list_skills_info respects offset', async () => {
    const server = createServer();
    const first = await server._registeredTools.list_skills_info.handler({ limit: 3, offset: 0 });
    const second = await server._registeredTools.list_skills_info.handler({ limit: 3, offset: 3 });
    const p1 = JSON.parse(first.content[0].text);
    const p2 = JSON.parse(second.content[0].text);

    const names1 = p1.skills.map((s) => s.name);
    const names2 = p2.skills.map((s) => s.name);
    assert.ok(!names1.some((n) => names2.includes(n)), 'pages must not overlap');
  });

  test('search_skills returns pagination fields', async () => {
    const server = createServer();
    const result = await server._registeredTools.search_skills.handler({ query: 'ui', limit: 3, offset: 0 });
    const payload = JSON.parse(result.content[0].text);

    assert.ok(typeof payload.total === 'number');
    assert.equal(payload.limit, 3);
    assert.equal(payload.offset, 0);
    assert.ok(Array.isArray(payload.matches));
    assert.ok(payload.matches.length <= 3);
  });

  test('list_skills_info defaults to limit 20', async () => {
    const server = createServer();
    const result = await server._registeredTools.list_skills_info.handler({});
    const payload = JSON.parse(result.content[0].text);

    assert.equal(payload.limit, 20);
    assert.equal(payload.offset, 0);
    assert.ok(payload.skills.length <= 20);
  });
});

describe('cache integration', () => {
  test('SkillCache falls back to in-memory when REDIS_URL is unset', async () => {
    const { SkillCache } = await import('../bin/cache.mjs');
    const cache = new SkillCache();

    await cache.set('test:key', { value: 42 }, 60);
    const result = await cache.get('test:key');
    assert.deepEqual(result, { value: 42 });

    await cache.invalidate('test:');
    const after = await cache.get('test:key');
    assert.equal(after, null);

    await cache.close();
  });
});

describe('vector search', () => {
  test('VectorSearch reports unavailable when QDRANT_URL is unset', async () => {
    const originalQdrantUrl = process.env.QDRANT_URL;

    delete process.env.QDRANT_URL;

    try {
      const { VectorSearch } = await import('../bin/vector.mjs');
      const vs = new VectorSearch();
      const available = await vs.available();
      assert.equal(available, false);
    } finally {
      if (originalQdrantUrl === undefined) {
        delete process.env.QDRANT_URL;
      } else {
        process.env.QDRANT_URL = originalQdrantUrl;
      }
    }
  });

  test('VectorSearch.search returns null when unavailable', async () => {
    const { VectorSearch } = await import('../bin/vector.mjs');
    const vs = new VectorSearch();
    const result = await vs.search('vue components', 5);
    assert.equal(result, null);
  });
});
