import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, test } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createServer } from '../bin/mcp.mjs';

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

  test('installs a predefined group into a project-local tool scope', () => {
    const projectRoot = createTempHome();
    const moduleUrl = mcpFileUrl();

    const installOutput = runInlineModule(
      `
        import { installOrUpdate } from ${JSON.stringify(moduleUrl)};
        const result = installOrUpdate({
          mode: 'install',
          tools: ['codex'],
          groups: ['ui'],
          project: true,
          projectRoot: ${JSON.stringify(projectRoot)},
        });
        console.log(result.content[0].text);
      `,
    );

    assert.match(installOutput, /"project": true/);
    assert.ok(fs.existsSync(path.join(projectRoot, '.codex', 'skills', 'preact-ui', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(projectRoot, '.codex', 'skills', 'vue-ui', 'SKILL.md')));
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

describe('overlay tools', () => {
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

describe('stdio e2e', () => {
  test('supports tools, prompts, resources, and tool calls over stdio', async () => {
    const projectRoot = createTempHome();
    const userOverlay = createOverlaySource();
    const script = new URL('../bin/mcp.mjs', import.meta.url);

    const client = new Client({
      name: 'web-ui-skills-test-client',
      version: '1.0.0',
    });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [script.pathname],
      cwd: projectRoot,
      env: {
        ...process.env,
        CODEX_HOME: createTempHome(),
        WEB_UI_SKILLS_CLIENT: 'codex',
        WEB_UI_SKILLS_USER_SOURCE: userOverlay,
      },
    });

    try {
      await client.connect(transport);

      const tools = await client.listTools();
      const toolNames = tools.tools.map((tool) => tool.name);
      assert.ok(toolNames.includes('search_skills'));
      assert.ok(toolNames.includes('list_overlays'));
      assert.ok(toolNames.includes('sync_overlays'));
      assert.ok(toolNames.includes('promote_skill'));

      const prompts = await client.listPrompts();
      assert.ok(prompts.prompts.some((prompt) => prompt.name === 'how-to-use-web-ui-skills'));
      assert.ok(prompts.prompts.some((prompt) => prompt.name === 'install-group-plan'));

      const resources = await client.listResources();
      assert.ok(resources.resources.some((resource) => resource.uri === 'web-ui-skills://guide'));

      const guide = await client.readResource({ uri: 'web-ui-skills://guide' });
      assert.match(guide.contents[0].text, /Use list_overlays to inspect repo, user, and project sources and precedence/);

      const overlayResult = await client.callTool({
        name: 'list_overlays',
        arguments: { project: true, projectRoot },
      });
      const overlayPayload = JSON.parse(overlayResult.content[0].text);
      assert.equal(overlayPayload.overlays.project, true);
      assert.ok(overlayPayload.overlays.merged.skills.includes('private-ui'));

      const skillInfo = await client.callTool({
        name: 'get_skill_info',
        arguments: { name: 'preact-ui' },
      });
      const skillPayload = JSON.parse(skillInfo.content[0].text);
      assert.equal(skillPayload.skill.name, 'preact-ui');

      const groupInfo = await client.callTool({
        name: 'get_group_info',
        arguments: { name: 'ui' },
      });
      const groupPayload = JSON.parse(groupInfo.content[0].text);
      assert.equal(groupPayload.group.name, 'ui');

      const listSkills = await client.callTool({
        name: 'list_skills_info',
        arguments: {},
      });
      const listSkillsPayload = JSON.parse(listSkills.content[0].text);
      assert.ok(listSkillsPayload.skills.some((skill) => skill.name === 'preact-ui'));

      const syncResult = await client.callTool({
        name: 'sync_overlays',
        arguments: { target: 'project', projectRoot },
      });
      const syncPayload = JSON.parse(syncResult.content[0].text);
      assert.equal(syncPayload.sync.target, 'project');
      assert.ok(fs.existsSync(path.join(projectRoot, '.web-ui-skills', 'skills', 'private-ui', 'SKILL.md')));

      const promoteResult = await client.callTool({
        name: 'promote_skill',
        arguments: { name: 'private-ui', projectRoot },
      });
      const promotePayload = JSON.parse(promoteResult.content[0].text);
      assert.equal(promotePayload.promote.ok, true);
      assert.ok(fs.existsSync(path.join(userOverlay, 'private-ui', 'SKILL.md')));
    } finally {
      await transport.close().catch(() => {});
    }
  });
});

describe('skill info tools', () => {
  test('returns detailed info for one skill', async () => {
    const server = createServer();
    const result = await server._registeredTools.get_skill_info.handler({ name: 'preact-ui' });
    const payload = JSON.parse(result.content[0].text);

    assert.equal(payload.skill.name, 'preact-ui');
    assert.equal(payload.skill.folder, 'preact-ui');
    assert.match(payload.skill.description, /Use when designing, refactoring, or reviewing Preact pages and components/);
    assert.match(payload.skill.path, /skills\/preact-ui$/);
  });

  test('returns detailed info for one group', async () => {
    const server = createServer();
    const result = await server._registeredTools.get_group_info.handler({ name: 'ui' });
    const payload = JSON.parse(result.content[0].text);

    assert.equal(payload.group.name, 'ui');
    assert.equal(payload.group.description, 'UI framework, component, and styling workflows.');
    assert.equal(payload.group.skills.length, 4);
    assert.deepEqual(
      payload.group.skills.map((skill) => skill.name),
      ['preact-ui', 'vue-ui', 'scss-system', 'storybook-ui'],
    );
    assert.ok(payload.group.skills.every((skill) => typeof skill.path === 'string' && skill.path.endsWith(skill.folder)));
  });

  test('returns detailed info for all skills', async () => {
    const server = createServer();
    const result = await server._registeredTools.list_skills_info.handler({});
    const payload = JSON.parse(result.content[0].text);

    assert.ok(Array.isArray(payload.skills));
    assert.ok(payload.skills.length > 0);
    assert.ok(payload.skills.some((skill) => skill.name === 'preact-ui'));
    assert.ok(payload.skills.every((skill) => skill.name && skill.folder && skill.path));
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
