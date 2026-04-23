#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { skillCache } from './cache.mjs';
import { vectorSearch } from './vector.mjs';

const require = createRequire(import.meta.url);
const installer = require('./install.js');
const { version: packageVersion } = require('../package.json');

const TOOL_NAMES = Object.keys(installer.TOOLS);
const toolNameSchema = z.enum(TOOL_NAMES);
const CLIENT_NAMES = ['codex', 'claude', 'copilot', 'kilo'];

function textContent(value) {
  return { content: [{ type: 'text', text: value }] };
}

function jsonContent(value) {
  return textContent(JSON.stringify(value, null, 2));
}

function prunedSkillDetail(skill) {
  if (!skill) return null;
  const { path, ...rest } = skill;
  return rest;
}

function prunedSkillList(skills) {
  return skills.map(s => prunedSkillDetail(s));
}

function prunedResponse(obj) {
  const { client, projectRoot, ...rest } = obj;
  const cleaned = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== null && v !== undefined)
  );
  return cleaned;
}

function prunedJsonContent(value) {
  return jsonContent(prunedResponse(value));
}

function captureConsole(fn) {
  const stdout = [];
  const stderr = [];
  const warnings = [];
  const original = {
    log: console.log,
    error: console.error,
    warn: console.warn,
  };

  console.log = (...args) => stdout.push(args.join(' '));
  console.error = (...args) => stderr.push(args.join(' '));
  console.warn = (...args) => warnings.push(args.join(' '));

  try {
    const result = fn();
    return { result, stdout, stderr, warnings };
  } finally {
    console.log = original.log;
    console.error = original.error;
    console.warn = original.warn;
  }
}

function normalizeTools(tools, allTools) {
  if (allTools || !tools || tools.length === 0) return TOOL_NAMES;
  return [...new Set(tools)];
}

function resolveTargetDirs({ project = false, projectRoot } = {}) {
  return installer.resolveToolDirs({
    project,
    projectRoot: projectRoot || process.cwd(),
  });
}

function resolveSkillDetail(name) {
  return installer.getSkillDetail(name);
}

function resolveGroupDetail(name) {
  const groups = installer.loadSkillGroups();
  const group = groups[String(name).toLowerCase()];
  if (!group) return null;

  return {
    name: String(name).toLowerCase(),
    description: group.description,
    skills: group.skills.map((skillName) => resolveSkillDetail(skillName) || {
      name: skillName,
      folder: skillName,
      description: '',
      path: null,
    }),
  };
}

function resolveOverlayInfo({ project = false, projectRoot = process.cwd() } = {}) {
  const repoSource = installer.getSkillsSource();
  const userSource = installer.getUserSkillsSource();
  const projectSource = installer.getProjectSkillsSource(projectRoot);
  const effectiveSources = project ? [repoSource, userSource, projectSource] : [repoSource, userSource];

  const sources = [
    { scope: 'repo', priority: 0, path: repoSource },
    { scope: 'user', priority: 1, path: userSource },
    { scope: 'project', priority: 2, path: projectSource },
  ].map((source) => {
    const exists = fs.existsSync(source.path);
    const skills = exists ? installer.getTopLevelSkills(source.path) : [];
    const groups = exists ? Object.keys(installer.loadSkillGroups(source.path)).sort() : [];

    return {
      ...source,
      exists,
      active: source.scope !== 'project' || project,
      skillCount: skills.length,
      groupCount: groups.length,
      skills,
      groups,
    };
  });

  const mergedSkills = installer.getTopLevelSkills(effectiveSources);
  const mergedGroups = Object.keys(installer.loadSkillGroups(effectiveSources)).sort();

  return {
    project,
    projectRoot: project ? projectRoot : null,
    precedence: ['repo', 'user', 'project'],
    sources,
    merged: {
      skillCount: mergedSkills.length,
      groupCount: mergedGroups.length,
      skills: mergedSkills,
      groups: mergedGroups,
    },
  };
}

function resolveClientName(value) {
  if (!value) return null;

  const normalized = String(value).trim().toLowerCase();
  return CLIENT_NAMES.includes(normalized) ? normalized : null;
}

function resolveBooleanEnv(value) {
  if (value === undefined || value === null || value === '') return null;

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return null;
}

function resolveServerContext(options = {}) {
  const client =
    resolveClientName(options.client) ??
    resolveClientName(process.env.WEB_UI_SKILLS_CLIENT) ??
    resolveClientName(process.env.WEB_UI_SKILLS_TOOL) ??
    resolveClientName(process.env.CODEX_CLIENT) ??
    resolveClientName(process.env.CLAUDE_CLIENT) ??
    resolveClientName(process.env.COPILOT_CLIENT) ??
    resolveClientName(process.env.KILO_CLIENT);

  const project =
    resolveBooleanEnv(options.project) ??
    resolveBooleanEnv(process.env.WEB_UI_SKILLS_PROJECT);
  const projectRoot = options.projectRoot ?? process.env.WEB_UI_SKILLS_PROJECT_ROOT ?? null;

  return { client, project, projectRoot };
}

function describeClientContext(context) {
  return context.client ? `Active MCP client: ${context.client}.` : 'Active MCP client: unknown.';
}

function runCliOperation({
  mode,
  tools,
  skills = [],
  groups = [],
  allTools = false,
  project = false,
  projectRoot = null,
}) {
  const args = [];
  if (project) {
    args.push('--project');
    if (projectRoot) {
      args.push('--project-root', projectRoot);
    }
  }
  if (mode === 'remove' && allTools) {
    args.push('--all');
  } else if (tools && tools.length > 0) {
    for (const tool of normalizeTools(tools, false)) {
      args.push(`--${tool}`);
    }
  }

  if (mode === 'remove') {
    args.push('remove');
  }

  for (const group of groups) {
    args.push('--group', group);
  }

  for (const skill of skills) {
    args.push(skill);
  }

  return captureConsole(() => installer.runCli(args));
}

function installOrUpdate({
  mode,
  tools,
  skills = [],
  groups = [],
  allTools = false,
  project = undefined,
  projectRoot = null,
  context = resolveServerContext(),
}) {
  const effectiveProject = project ?? context.project ?? false;
  const effectiveProjectRoot = projectRoot ?? context.projectRoot ?? null;
  const result = runCliOperation({
    mode,
    tools,
    skills,
    groups,
    allTools,
    project: effectiveProject,
    projectRoot: effectiveProjectRoot,
  });
  const ok = result.result === 0;
  if (ok) skillCache.invalidate('wus:').catch(() => {});

  return prunedJsonContent({
    ok,
    mode,
    client: context.client,
    project: effectiveProject,
    projectRoot: effectiveProjectRoot,
    tools: normalizeTools(tools, allTools),
    skills,
    groups,
    output: {
      stdout: result.stdout,
      stderr: result.stderr,
      warnings: result.warnings,
    },
  });
}

function removeAllSkillsFromTool(toolName, targetDirs) {
  const targetDir = targetDirs[toolName];
  const skillsSource = installer.getSkillsSource();
  const skills = installer.getTopLevelSkills(skillsSource);
  const removed = [];
  const skipped = [];

  if (!fs.existsSync(targetDir)) {
    return { tool: toolName, targetDir, removed, skipped, exists: false };
  }

  for (const skill of skills) {
    const dest = path.join(targetDir, skill);
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
      removed.push(skill);
    } else {
      skipped.push(skill);
    }
  }

  return { tool: toolName, targetDir, removed, skipped, exists: true };
}

function removeSkillSelection({
  tools,
  skills = [],
  groups = [],
  allTools = false,
  allSkills = false,
  project = undefined,
  projectRoot = null,
  context = resolveServerContext(),
}) {
  const effectiveProject = project ?? context.project ?? false;
  const effectiveProjectRoot = projectRoot ?? context.projectRoot ?? null;
  const resolvedTools = normalizeTools(tools, allTools);
  const targetDirs = resolveTargetDirs({
    project: effectiveProject,
    projectRoot: effectiveProjectRoot,
  });

  if (!allTools && (!tools || tools.length === 0)) {
    return prunedJsonContent({
      ok: false,
      error: 'Provide at least one tool or set allTools=true for remove operations.',
    });
  }

  if (allSkills) {
    const results = resolvedTools.map((tool) => removeAllSkillsFromTool(tool, targetDirs));
    skillCache.invalidate('wus:').catch(() => {});
    return prunedJsonContent({
      ok: true,
      mode: 'remove',
      client: context.client,
      project: effectiveProject,
      projectRoot: effectiveProjectRoot,
      allSkills: true,
      tools: resolvedTools,
      results,
    });
  }

  const result = runCliOperation({
    mode: 'remove',
    tools: resolvedTools,
    skills,
    groups,
    allTools,
    project: effectiveProject,
    projectRoot: effectiveProjectRoot,
  });

  skillCache.invalidate('wus:').catch(() => {});
  return prunedJsonContent({
    ok: result.result === 0,
    mode: 'remove',
    client: context.client,
    project: effectiveProject,
    projectRoot: effectiveProjectRoot,
    allSkills: false,
    tools: resolvedTools,
    skills,
    groups,
    output: {
      stdout: result.stdout,
      stderr: result.stderr,
      warnings: result.warnings,
    },
  });
}

function createServer(options = {}) {
  const context = resolveServerContext(options);
  const server = new McpServer({
    name: 'web-ui-skills',
    version: packageVersion,
  });

  setImmediate(async () => {
    if (await vectorSearch.available()) {
      const skills = installer.getAllSkillDetails();
      await vectorSearch.ensureIndex(skills).catch(() => {});
    }
  });

  server.registerResource(
    'usage-guide',
    'web-ui-skills://guide',
    {
      title: 'Web UI Skills Guide',
      description: 'Short guide for discovering, grouping, installing, updating, and removing skills.',
      mimeType: 'text/plain',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: [
            'Web UI Skills MCP guide:',
            '- Use search_skills to find a skill by folder name or frontmatter name.',
            '- Use list_groups to inspect curated skill bundles before installing.',
            '- Use list_overlays to inspect repo, user, and project sources and precedence.',
            '- Use sync_overlays to materialize the merged skill view into the user or project overlay directory.',
            '- Use promote_skill to copy one skill from the project overlay into the user overlay.',
            '- Use get_skill_info to inspect one skill, get_group_info to inspect one group with skill metadata, and list_skills_info to inspect all skills.',
            '- Use install_skills to install one or more skills or groups.',
            '- Use update_skills to refresh installed skills for selected tools.',
            '- Use remove_skills to remove specific skills, groups, or everything from a selected tool scope.',
            `- ${describeClientContext(context)}`,
            '- Group names are defined in skills/groups.json.',
            '- Tools are: codex, claude, copilot, and kilo.',
          ].join('\n'),
        },
      ],
    }),
  );

  server.registerTool(
    'search_skills',
    {
      title: 'Search skills',
      description: 'Search the local skill catalog by folder name, frontmatter skill name, or description.',
      inputSchema: z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(40).optional(),
        offset: z.number().int().min(0).optional(),
      }),
    },
    async ({ query, limit, offset }) => {
      const effectiveLimit = limit ?? 20;
      const effectiveOffset = offset ?? 0;

      const cacheKey = `wus:search:${query}`;
      let allMatches = await skillCache.get(cacheKey);

      if (!allMatches) {
        const vectorResults = await vectorSearch.search(query, 40);
        if (vectorResults) {
          const allDetails = installer.getAllSkillDetails();
          const detailMap = new Map(allDetails.map((s) => [s.name, s]));
          allMatches = vectorResults
            .map((r) => detailMap.get(r.name))
            .filter(Boolean);
        } else {
          allMatches = installer.searchSkills(query);
        }
        await skillCache.set(cacheKey, allMatches, 120);
      }

      const total = allMatches.length;
      const matches = allMatches.slice(effectiveOffset, effectiveOffset + effectiveLimit);

      return prunedJsonContent({
        client: context.client,
        query,
        total,
        limit: effectiveLimit,
        offset: effectiveOffset,
        matches: matches.map((skill) => ({
          folder: skill.dir || skill.folder,
          name: skill.name,
          description: skill.description,
        })),
      });
    },
  );

  server.registerTool(
    'list_groups',
    {
      title: 'List skill groups',
      description: 'List curated skill groups and the skills included in each group.',
      inputSchema: z.object({}),
    },
    async () => {
      return prunedJsonContent({
        client: context.client,
        groups: installer.getGroupEntries().map((group) => ({
          name: group.name,
          description: group.description,
          skills: group.skills,
        })),
      });
    },
  );

  server.registerTool(
    'list_overlays',
    {
      title: 'List overlays',
      description: 'List the repo, user, and project skill sources that feed the merged skill view.',
      inputSchema: z.object({
        project: z.boolean().optional(),
        projectRoot: z.string().min(1).optional(),
      }),
    },
    async (input = {}) => prunedJsonContent({
      client: context.client,
      overlays: resolveOverlayInfo({
        project: input.project ?? context.project ?? false,
        projectRoot: input.projectRoot ?? context.projectRoot ?? process.cwd(),
      }),
    }),
  );

  server.registerTool(
    'sync_overlays',
    {
      title: 'Sync overlays',
      description: 'Materialize the merged skill view into the user or project overlay directory.',
      inputSchema: z.object({
        target: z.enum(['user', 'project']).optional(),
        projectRoot: z.string().min(1).optional(),
      }),
    },
    async (input = {}) => prunedJsonContent({
      client: context.client,
      sync: installer.syncOverlaySources({
        target: input.target || 'project',
        projectRoot: input.projectRoot ?? context.projectRoot ?? process.cwd(),
      }),
    }),
  );

  server.registerTool(
    'promote_skill',
    {
      title: 'Promote skill',
      description: 'Promote one skill from the project overlay into the user overlay directory.',
      inputSchema: z.object({
        name: z.string().min(1),
        projectRoot: z.string().min(1).optional(),
      }),
    },
    async (input = {}) => prunedJsonContent({
      client: context.client,
      promote: installer.promoteOverlaySkill({
        name: input.name,
        projectRoot: input.projectRoot ?? context.projectRoot ?? process.cwd(),
      }),
    }),
  );

  server.registerTool(
    'get_skill_info',
    {
      title: 'Get skill info',
      description: 'Get detailed information for one skill, including its description and filesystem path.',
      inputSchema: z.object({
        name: z.string().min(1),
      }),
    },
    async ({ name }) => prunedJsonContent({
      client: context.client,
      skill: prunedSkillDetail(resolveSkillDetail(name)),
    }),
  );

  server.registerTool(
    'get_skill_content',
    {
      title: 'Get skill content',
      description: 'Get the full markdown body of a skill\'s SKILL.md file (frontmatter stripped). Call this after get_skill_info to read the actual instructions for a skill.',
      inputSchema: z.object({
        name: z.string().min(1),
      }),
    },
    async ({ name }) => prunedJsonContent({
      client: context.client,
      name,
      content: installer.getSkillContent(name),
    }),
  );

  server.registerTool(
    'get_skill_references',
    {
      title: 'Get skill references',
      description: 'List reference files for a skill, or read one reference file. Call without `reference` to list available filenames; call with `reference` (e.g. "types.md") to read that file\'s content.',
      inputSchema: z.object({
        name: z.string().min(1),
        reference: z.string().min(1).optional(),
      }),
    },
    async ({ name, reference }) => {
      if (reference) {
        return prunedJsonContent({
          client: context.client,
          name,
          reference,
          content: installer.getSkillReferenceContent(name, reference),
        });
      }
      return prunedJsonContent({
        client: context.client,
        name,
        references: installer.getSkillReferenceFiles(name),
      });
    },
  );

  server.registerTool(
    'get_group_info',
    {
      title: 'Get group info',
      description: 'Get a group with its description and detailed skill metadata for each skill in the group.',
      inputSchema: z.object({
        name: z.string().min(1),
      }),
    },
    async ({ name }) => {
      const group = resolveGroupDetail(name);
      return prunedJsonContent({
        client: context.client,
        group: group ? { ...group, skills: prunedSkillList(group.skills) } : null,
      });
    },
  );

  server.registerTool(
    'list_skills_info',
    {
      title: 'List skills info',
      description: 'List all available skills with detailed metadata, including folder, name, description, and path.',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(40).optional(),
        offset: z.number().int().min(0).optional(),
      }),
    },
    async (input = {}) => {
      const allSkills = installer.getAllSkillDetails();
      const limit = input.limit ?? 20;
      const offset = input.offset ?? 0;
      const total = allSkills.length;
      const skills = allSkills.slice(offset, offset + limit);

      return prunedJsonContent({
        client: context.client,
        total,
        limit,
        offset,
        skills: prunedSkillList(skills),
      });
    },
  );

  server.registerTool(
    'install_skills',
    {
      title: 'Install skills',
      description: 'Install one or more skills or groups to selected tools. If no tools are provided, all tools are targeted. Can install globally or into the current project.',
      inputSchema: z.object({
        tools: z.array(toolNameSchema).optional(),
        skills: z.array(z.string().min(1)).optional(),
        groups: z.array(z.string().min(1)).optional(),
        allTools: z.boolean().optional(),
        project: z.boolean().optional(),
        projectRoot: z.string().min(1).optional(),
      }),
    },
    async (input) => installOrUpdate({ mode: 'install', ...input, context }),
  );

  server.registerTool(
    'update_skills',
    {
      title: 'Update skills',
      description: 'Reinstall one or more skills or groups to refresh local copies for the selected tools. Can target global or project-local installs.',
      inputSchema: z.object({
        tools: z.array(toolNameSchema).optional(),
        skills: z.array(z.string().min(1)).optional(),
        groups: z.array(z.string().min(1)).optional(),
        allTools: z.boolean().optional(),
        project: z.boolean().optional(),
        projectRoot: z.string().min(1).optional(),
      }),
    },
    async (input) => installOrUpdate({ mode: 'update', ...input, context }),
  );

  server.registerTool(
    'remove_skills',
    {
      title: 'Remove skills',
      description: 'Remove one or more skills or groups from selected tools. Use allSkills=true to remove every installed skill from the selected tools. Can target global or project-local installs.',
      inputSchema: z.object({
        tools: z.array(toolNameSchema).optional(),
        skills: z.array(z.string().min(1)).optional(),
        groups: z.array(z.string().min(1)).optional(),
        allTools: z.boolean().optional(),
        allSkills: z.boolean().optional(),
        project: z.boolean().optional(),
        projectRoot: z.string().min(1).optional(),
      }),
    },
    async (input) => removeSkillSelection({ ...input, context }),
  );

  server.registerPrompt(
    'how-to-use-web-ui-skills',
    {
      title: 'How to use Web UI Skills MCP',
      description: 'Generate a concise plan for searching, installing, updating, or removing skills through this MCP server.',
      argsSchema: {
        goal: z.string().min(1).optional(),
      },
    },
    async ({ goal }) => {
      const objective = goal ? `Goal: ${goal}` : 'Goal: inspect, install, update, or remove skills.';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                'Use the web-ui-skills MCP server with this order:',
                '1. Call search_skills when you need to find exact skill names.',
                '2. Call list_groups when you want curated bundles.',
                '3. Call install_skills to install chosen skills or groups.',
                '4. Call update_skills to refresh an existing installation.',
                '5. Call remove_skills to delete selected skills, groups, or all skills in a selected tool scope.',
                '6. Prefer a single explicit tool scope unless the user clearly wants all tools.',
                `7. ${describeClientContext(context)}`,
                '8. Set project=true to install into project-local tool folders instead of global user folders.',
                objective,
              ].join('\n'),
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    'install-group-plan',
    {
      title: 'Install Group Plan',
      description: 'Generate a concise step-by-step plan for installing a skill group or a full skills bundle.',
      argsSchema: {
        group: z.string().min(1).optional(),
      },
    },
    async ({ group }) => {
      const target = group ? `Target group: ${group}` : 'Target group: all groups or all skills as requested.';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                'Use this installation plan:',
                '1. Call list_groups to inspect the curated bundles.',
                '2. Call search_skills if you need to verify individual skill names.',
                '3. Call install_skills with the chosen group or groups.',
                '4. Prefer the smallest scope that satisfies the request.',
                '5. If the user wants everything, pass allTools=true or target all tools explicitly.',
                `6. ${describeClientContext(context)}`,
                '7. Set project=true to install into project-local tool folders instead of global user folders.',
                target,
              ].join('\n'),
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    'update-skills-plan',
    {
      title: 'Update Skills Plan',
      description: 'Generate a concise step-by-step plan for refreshing installed skills or groups.',
      argsSchema: {
        group: z.string().min(1).optional(),
        tools: z.array(toolNameSchema).optional(),
      },
    },
    async ({ group, tools }) => {
      const scope = tools && tools.length > 0 ? `Tools: ${tools.join(', ')}` : 'Tools: use the smallest explicit scope available.';
      const target = group ? `Target group: ${group}` : 'Target group: no specific group provided.';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                'Use this update plan:',
                '1. Call list_groups if you need to confirm the group contents.',
                '2. Call search_skills if you need to confirm exact skill names.',
                '3. Call update_skills with the relevant tools and either skills or groups.',
                '4. Prefer updating only what the user asked for; do not broaden the scope unnecessarily.',
                '5. If no tools are given, update all tools only when the user explicitly wants a full refresh.',
                `6. ${describeClientContext(context)}`,
                '7. Set project=true to update project-local installs instead of global user folders.',
                scope,
                target,
              ].join('\n'),
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    'remove-skills-plan',
    {
      title: 'Remove Skills Plan',
      description: 'Generate a concise step-by-step plan for removing installed skills or groups safely.',
      argsSchema: {
        group: z.string().min(1).optional(),
        tools: z.array(toolNameSchema).optional(),
        allSkills: z.boolean().optional(),
      },
    },
    async ({ group, tools, allSkills }) => {
      const scope = tools && tools.length > 0 ? `Tools: ${tools.join(', ')}` : 'Tools: require an explicit scope before removing anything.';
      const target = allSkills ? 'Remove all installed skills for the selected tools.' : group ? `Target group: ${group}` : 'Target group: no specific group provided.';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                'Use this removal plan:',
                '1. Confirm the tool scope before removing anything.',
                '2. Call list_groups if you need to resolve a group name.',
                '3. Call remove_skills with the selected tools and the smallest safe scope.',
                '4. Use allSkills=true only when the user explicitly wants a full wipe of the selected tool scope.',
                '5. Prefer removing one group or one skill set at a time when possible.',
                `6. ${describeClientContext(context)}`,
                '7. Set project=true to remove from project-local installs instead of global user folders.',
                scope,
                target,
              ].join('\n'),
            },
          },
        ],
      };
    },
  );

  return server;
}

export async function runMcpServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.on('SIGTERM', async () => {
    await skillCache.close().catch(() => {});
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    await skillCache.close().catch(() => {});
    process.exit(0);
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runMcpServer().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

export {
  captureConsole,
  createServer,
  installOrUpdate,
  jsonContent,
  normalizeTools,
  resolveClientName,
  resolveServerContext,
  removeAllSkillsFromTool,
  removeSkillSelection,
  runCliOperation,
  textContent,
};
