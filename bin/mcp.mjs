#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

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

function resolveClientName(value) {
  if (!value) return null;

  const normalized = String(value).trim().toLowerCase();
  return CLIENT_NAMES.includes(normalized) ? normalized : null;
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

  return { client };
}

function describeClientContext(context) {
  return context.client ? `Active MCP client: ${context.client}.` : 'Active MCP client: unknown.';
}

function runCliOperation({ mode, tools, skills = [], groups = [], allTools = false }) {
  const args = [];
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

function installOrUpdate({ mode, tools, skills = [], groups = [], allTools = false, context = resolveServerContext() }) {
  const result = runCliOperation({ mode, tools, skills, groups, allTools });
  const ok = result.result === 0;

  return jsonContent({
    ok,
    mode,
    client: context.client,
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

function removeAllSkillsFromTool(toolName) {
  const targetDir = installer.TOOLS[toolName];
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
  context = resolveServerContext(),
}) {
  const resolvedTools = normalizeTools(tools, allTools);

  if (!allTools && (!tools || tools.length === 0)) {
    return jsonContent({
      ok: false,
      error: 'Provide at least one tool or set allTools=true for remove operations.',
    });
  }

  if (allSkills) {
    const results = resolvedTools.map((tool) => removeAllSkillsFromTool(tool));
    return jsonContent({
      ok: true,
      mode: 'remove',
      client: context.client,
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
  });

  return jsonContent({
    ok: result.result === 0,
    mode: 'remove',
    client: context.client,
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
      description: 'Search the local skill catalog by folder name or frontmatter skill name.',
      inputSchema: z.object({
        query: z.string().min(1),
      }),
    },
    async ({ query }) => {
      const matches = installer.searchSkills(query);
      return jsonContent({
        client: context.client,
        query,
        matches: matches.map((skill) => ({
          folder: skill.dir,
          name: skill.name,
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
      return jsonContent({
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
    'install_skills',
    {
      title: 'Install skills',
      description: 'Install one or more skills or groups to selected tools. If no tools are provided, all tools are targeted.',
      inputSchema: z.object({
        tools: z.array(toolNameSchema).optional(),
        skills: z.array(z.string().min(1)).optional(),
        groups: z.array(z.string().min(1)).optional(),
        allTools: z.boolean().optional(),
      }),
    },
    async (input) => installOrUpdate({ mode: 'install', ...input, context }),
  );

  server.registerTool(
    'update_skills',
    {
      title: 'Update skills',
      description: 'Reinstall one or more skills or groups to refresh local copies for the selected tools.',
      inputSchema: z.object({
        tools: z.array(toolNameSchema).optional(),
        skills: z.array(z.string().min(1)).optional(),
        groups: z.array(z.string().min(1)).optional(),
        allTools: z.boolean().optional(),
      }),
    },
    async (input) => installOrUpdate({ mode: 'update', ...input, context }),
  );

  server.registerTool(
    'remove_skills',
    {
      title: 'Remove skills',
      description: 'Remove one or more skills or groups from selected tools. Use allSkills=true to remove every installed skill from the selected tools.',
      inputSchema: z.object({
        tools: z.array(toolNameSchema).optional(),
        skills: z.array(z.string().min(1)).optional(),
        groups: z.array(z.string().min(1)).optional(),
        allTools: z.boolean().optional(),
        allSkills: z.boolean().optional(),
      }),
    },
    async (input) => removeSkillSelection({ ...input, context }),
  );

  server.registerPrompt(
    'how-to-use-web-ui-skills',
    {
      title: 'How to use Web UI Skills MCP',
      description: 'Generate a concise plan for searching, installing, updating, or removing skills through this MCP server.',
      argsSchema: z.object({
        goal: z.string().min(1).optional(),
      }),
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
      argsSchema: z.object({
        group: z.string().min(1).optional(),
      }),
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
      argsSchema: z.object({
        group: z.string().min(1).optional(),
        tools: z.array(toolNameSchema).optional(),
      }),
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
      argsSchema: z.object({
        group: z.string().min(1).optional(),
        tools: z.array(toolNameSchema).optional(),
        allSkills: z.boolean().optional(),
      }),
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
