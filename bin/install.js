#!/usr/bin/env node
'use strict';

const fs = require('fs');
const childProcess = require('child_process');
const os = require('os');
const path = require('path');

const runtime = {
  spawnSync: childProcess.spawnSync,
};

const SKILL_FILE = 'SKILL.md';
const GROUPS_FILE = 'groups.json';
const USER_SKILLS_HOME = '.web-ui-skills';
const TOOL_FOLDER_NAMES = {
  codex: '.codex',
  claude: '.claude',
  copilot: '.copilot',
  kilo: '.kilocode',
};

function resolveGlobalToolDir(toolName) {
  const homeOverrides = {
    codex: process.env.CODEX_HOME,
    claude: process.env.CLAUDE_HOME,
    copilot: process.env.COPILOT_HOME,
    kilo: process.env.KILOCODE_HOME,
  };

  const defaults = {
    codex: path.join(os.homedir(), '.codex'),
    claude: path.join(os.homedir(), '.claude'),
    copilot: path.join(os.homedir(), '.copilot'),
    kilo: path.join(os.homedir(), '.kilocode'),
  };

  return path.join(homeOverrides[toolName] || defaults[toolName], 'skills');
}

function resolveProjectToolDir(toolName, projectRoot = process.cwd()) {
  return path.join(projectRoot, TOOL_FOLDER_NAMES[toolName], 'skills');
}

function resolveToolDirs({ project = false, projectRoot = process.cwd() } = {}) {
  if (project) {
    return {
      codex: resolveProjectToolDir('codex', projectRoot),
      claude: resolveProjectToolDir('claude', projectRoot),
      copilot: resolveProjectToolDir('copilot', projectRoot),
      kilo: resolveProjectToolDir('kilo', projectRoot),
    };
  }

  return {
    codex: resolveGlobalToolDir('codex'),
    claude: resolveGlobalToolDir('claude'),
    copilot: resolveGlobalToolDir('copilot'),
    kilo: resolveGlobalToolDir('kilo'),
  };
}

function resolveToolDir(toolName) {
  return resolveToolDirs()[toolName];
}

const TOOLS = {
  codex: resolveToolDir('codex'),
  claude: resolveToolDir('claude'),
  copilot: resolveToolDir('copilot'),
  kilo: resolveToolDir('kilo'),
};

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getSkillsSource() {
  return path.join(__dirname, '..', 'skills');
}

function getUserSkillsSource() {
  return process.env.WEB_UI_SKILLS_USER_SOURCE || path.join(os.homedir(), USER_SKILLS_HOME, 'skills');
}

function getProjectSkillsSource(projectRoot = process.cwd()) {
  return path.join(projectRoot, USER_SKILLS_HOME, 'skills');
}

function getSkillsSources({ projectRoot = process.cwd() } = {}) {
  return [getSkillsSource(), getUserSkillsSource(), getProjectSkillsSource(projectRoot)];
}

function normalizeSkillsSources(skillsSource = getSkillsSources()) {
  return Array.isArray(skillsSource) ? skillsSource.filter(Boolean) : [skillsSource];
}

function getGroupsSource(skillsSource = getSkillsSource()) {
  return path.join(skillsSource, GROUPS_FILE);
}

function hasSkillFile(dir) {
  return fs.existsSync(path.join(dir, SKILL_FILE));
}

function getTopLevelSkills(skillsSource = getSkillsSources()) {
  const sources = normalizeSkillsSources(skillsSource);
  if (sources.length > 1) {
    return getMergedTopLevelSkills(sources);
  }

  const source = sources[0];
  if (!fs.existsSync(source)) return [];

  return fs
    .readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((skill) => hasSkillFile(path.join(source, skill)))
    .sort();
}

function getSkillEntries(skillsSource = getSkillsSources()) {
  const sources = normalizeSkillsSources(skillsSource);
  if (sources.length > 1) {
    return getMergedSkillEntries(sources);
  }

  const source = sources[0];
  return getTopLevelSkills(source).map((skill) => {
    const skillFile = path.join(source, skill, SKILL_FILE);
    const metadata = readSkillMetadata(skillFile);
    return {
      dir: skill,
      name: metadata.name || skill,
      description: metadata.description || '',
      path: path.join(source, skill),
    };
  });
}

function loadSkillGroupsFromSource(skillsSource = getSkillsSource()) {
  const groupsFile = getGroupsSource(skillsSource);
  if (!fs.existsSync(groupsFile)) return {};

  const raw = JSON.parse(fs.readFileSync(groupsFile, 'utf8'));
  const entries = Object.entries(raw);
  const groups = {};

  for (const [name, value] of entries) {
    if (!value || !Array.isArray(value.skills)) continue;
    groups[name.toLowerCase()] = {
      description: typeof value.description === 'string' ? value.description : '',
      skills: value.skills.filter((skill) => typeof skill === 'string' && skill.length > 0),
    };
  }

  return groups;
}

function loadSkillGroups(skillsSource = getSkillsSources()) {
  const sources = normalizeSkillsSources(skillsSource);
  if (sources.length > 1) {
    return loadMergedSkillGroups(sources);
  }

  return loadSkillGroupsFromSource(sources[0]);
}

function getMergedSkillEntries(skillsSources = getSkillsSources()) {
  const sources = normalizeSkillsSources(skillsSources);
  const merged = new Map();

  for (const source of sources) {
    if (!fs.existsSync(source)) continue;
    for (const entry of getSkillEntries(source)) {
      merged.set(entry.dir.toLowerCase(), entry);
    }
  }

  return [...merged.values()].sort((a, b) => a.dir.localeCompare(b.dir));
}

function getMergedTopLevelSkills(skillsSources = getSkillsSources()) {
  return getMergedSkillEntries(skillsSources).map((entry) => entry.dir);
}

function loadMergedSkillGroups(skillsSources = getSkillsSources()) {
  const sources = normalizeSkillsSources(skillsSources);
  const merged = {};

  for (const source of sources) {
    if (!fs.existsSync(source)) continue;
    Object.assign(merged, loadSkillGroupsFromSource(source));
  }

  return merged;
}

function syncOverlaySources({
  target = 'project',
  projectRoot = process.cwd(),
  skillsSources = getSkillsSources({ projectRoot }),
} = {}) {
  const sources = normalizeSkillsSources(skillsSources);
  const mergedSkills = getMergedSkillEntries(sources);
  const mergedGroups = loadMergedSkillGroups(sources);
  const destinationRoot = target === 'user'
    ? getUserSkillsSource()
    : getProjectSkillsSource(projectRoot);

  const stagingParent = fs.mkdtempSync(path.join(os.tmpdir(), 'web-ui-skills-sync-'));
  const stagingSkillsRoot = path.join(stagingParent, 'skills');
  fs.mkdirSync(stagingSkillsRoot, { recursive: true });

  for (const entry of mergedSkills) {
    const dest = path.join(stagingSkillsRoot, entry.dir);
    copyDir(entry.path, dest);
  }

  fs.writeFileSync(
    path.join(stagingSkillsRoot, GROUPS_FILE),
    `${JSON.stringify(mergedGroups, null, 2)}\n`,
  );

  fs.rmSync(destinationRoot, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destinationRoot), { recursive: true });
  fs.renameSync(stagingSkillsRoot, destinationRoot);
  fs.rmSync(stagingParent, { recursive: true, force: true });

  return {
    target,
    destinationRoot,
    sourceRoots: sources,
    skillCount: mergedSkills.length,
    groupCount: Object.keys(mergedGroups).length,
    skills: mergedSkills.map((entry) => entry.dir),
    groups: Object.keys(mergedGroups).sort(),
  };
}

function getGroupEntries(skillsSource = getSkillsSources()) {
  const groups = loadSkillGroups(skillsSource);
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, data]) => ({
      description: data.description,
      name,
      skills: data.skills,
    }));
}

function findSkillFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findSkillFiles(entryPath, results);
    } else if (entry.isFile() && entry.name === SKILL_FILE) {
      results.push(entryPath);
    }
  }

  return results;
}

function readSkillMetadata(skillFile) {
  const content = fs.readFileSync(skillFile, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { name: null, description: '' };

  const frontmatter = match[1];
  const readField = (field) => {
    const fieldMatch = frontmatter.match(new RegExp(`^${field}:\\s*(.+)\\s*$`, 'm'));
    return fieldMatch ? fieldMatch[1].trim().replace(/^['"]|['"]$/g, '') : null;
  };

  return {
    name: readField('name'),
    description: readField('description') || '',
  };
}

function readSkillName(skillFile) {
  return readSkillMetadata(skillFile).name;
}

function getSkillDetail(skillName, skillsSource = getSkillsSources()) {
  const entries = getSkillEntries(skillsSource);
  const target = skillName.toLowerCase();
  const entry = entries.find(
    (item) => item.dir.toLowerCase() === target || item.name.toLowerCase() === target,
  );

  if (!entry) return null;

  return {
    name: entry.name,
    folder: entry.dir,
    description: entry.description,
    path: entry.path,
  };
}

function getAllSkillDetails(skillsSource = getSkillsSources()) {
  return getSkillEntries(skillsSource).map((entry) => ({
    name: entry.name,
    folder: entry.dir,
    description: entry.description,
    path: entry.path,
  }));
}

function validateSkillTree(skillsSource = getSkillsSources()) {
  const sources = normalizeSkillsSources(skillsSource);
  if (sources.length > 1) {
    const combined = {
      skills: [],
      warnings: [],
    };

    for (const source of sources) {
      const validated = validateSkillTree(source);
      combined.skills.push(...validated.skills);
      combined.warnings.push(
        ...validated.warnings.map((warning) => `${source}: ${warning}`),
      );
    }

    return {
      skills: uniqueList(combined.skills).sort(),
      warnings: combined.warnings,
    };
  }

  const source = sources[0];
  const topLevelSkills = getTopLevelSkills(source);
  const warnings = [];

  for (const skill of topLevelSkills) {
    const skillFile = path.join(source, skill, SKILL_FILE);
    const skillName = readSkillName(skillFile);
    if (!skillName) {
      warnings.push(`Missing frontmatter name in ${path.relative(source, skillFile)}`);
    } else if (skillName !== skill) {
      warnings.push(`Skill directory/name mismatch: ${skill} uses name "${skillName}"`);
    }
  }

  const names = new Map();
  for (const skillFile of findSkillFiles(source)) {
    const skillName = readSkillName(skillFile);
    if (!skillName) continue;

    const relativePath = path.relative(source, skillFile);
    const previous = names.get(skillName);
    if (previous) {
      warnings.push(`Duplicate skill name "${skillName}" in ${previous} and ${relativePath}`);
    } else {
      names.set(skillName, relativePath);
    }
  }

  return { skills: topLevelSkills, warnings };
}

function uniqueList(items) {
  return [...new Set(items)];
}

function expandSelectedGroups(selectedGroups, skillsSource = getSkillsSources()) {
  if (!selectedGroups || selectedGroups.length === 0) return [];

  const groups = loadSkillGroups(skillsSource);
  const available = new Map(Object.entries(groups));
  const resolved = [];
  const missing = [];

  for (const groupName of selectedGroups) {
    const group = available.get(groupName.toLowerCase());
    if (!group) {
      missing.push(groupName);
      continue;
    }

    resolved.push(...group.skills);
  }

  if (missing.length > 0) {
    console.error(`✗ Unknown group(s): ${missing.join(', ')}`);
    return null;
  }

  return uniqueList(resolved);
}

function filterSelectedSkills(skills, selectedSkills, skillsSource = getSkillsSources()) {
  if (!selectedSkills || selectedSkills.length === 0) return skills;

  const entries = getSkillEntries(skillsSource);
  const available = new Map();
  for (const entry of entries) {
    available.set(entry.dir.toLowerCase(), entry.dir);
    available.set(entry.name.toLowerCase(), entry.dir);
  }

  const resolved = [];
  const missing = [];
  for (const skill of selectedSkills) {
    const match = available.get(skill.toLowerCase());
    if (match) {
      resolved.push(match);
    } else {
      missing.push(skill);
    }
  }

  if (missing.length > 0) {
    console.error(`✗ Unknown skill(s): ${missing.join(', ')}`);
    return null;
  }

  return resolved;
}

function resolveRequestedSkills(skills, selectedSkills, selectedGroups, skillsSource = getSkillsSources()) {
  const expandedGroups = expandSelectedGroups(selectedGroups, skillsSource);
  if (expandedGroups === null) return null;

  const combined = uniqueList([...(selectedSkills || []), ...expandedGroups]);
  return filterSelectedSkills(skills, combined, skillsSource);
}

function installForTool(
  toolName,
  selectedSkills = null,
  selectedGroups = null,
  targetDirs = TOOLS,
  skillsSource = getSkillsSources(),
) {
  const targetDir = targetDirs[toolName];

  if (!fs.existsSync(getSkillsSource())) {
    console.error(`✗ Skills source directory not found: ${getSkillsSource()}`);
    return false;
  }

  const { skills, warnings } = validateSkillTree(skillsSource);
  if (warnings.length > 0) {
    warnings.forEach((warning) => console.warn(`⚠ ${warning}`));
  }

  const skillsToInstall = resolveRequestedSkills(
    skills,
    selectedSkills,
    selectedGroups,
    skillsSource,
  );
  if (!skillsToInstall) return false;

  fs.mkdirSync(targetDir, { recursive: true });

  const entriesByFolder = new Map(
    getSkillEntries(skillsSource).map((entry) => [entry.dir.toLowerCase(), entry]),
  );
  let installed = 0;
  for (const skill of skillsToInstall) {
    const entry = entriesByFolder.get(skill.toLowerCase());
    if (!entry) {
      console.error(`✗ Missing skill source for ${skill}`);
      return false;
    }

    const src = entry.path;
    const dest = path.join(targetDir, skill);
    fs.rmSync(dest, { recursive: true, force: true });
    copyDir(src, dest);
    installed += 1;
  }

  console.log(`✓ Installed ${installed} skill(s) to ${targetDir}`);
  return true;
}

function deleteForTool(
  toolName,
  selectedSkills,
  selectedGroups = null,
  skillsSource = getSkillsSources(),
  targetDirs = TOOLS,
  deleteAll = false,
) {
  const targetDir = targetDirs[toolName];
  const skills = getTopLevelSkills(skillsSource);
  const skillsToDelete = resolveRequestedSkills(skills, selectedSkills, selectedGroups, skillsSource);

  if (deleteAll) {
    if (!fs.existsSync(targetDir)) {
      console.log(`ℹ Nothing to delete in ${targetDir}`);
      return true;
    }

    const installedEntries = fs.readdirSync(targetDir, { withFileTypes: true });
    const deleted = installedEntries.length;
    fs.rmSync(targetDir, { recursive: true, force: true });
    fs.mkdirSync(targetDir, { recursive: true });

    console.log(`  - removed ${deleted} item(s)`);
    console.log(`✓ Deleted all skill(s) from ${targetDir}`);
    return true;
  }

  if ((!selectedSkills || selectedSkills.length === 0) && (!selectedGroups || selectedGroups.length === 0)) {
    console.error('✗ Provide at least one skill or group name after --delete');
    return false;
  }

  if (!skillsToDelete) return false;

  if (!fs.existsSync(targetDir)) {
    console.log(`ℹ Nothing to delete in ${targetDir}`);
    return true;
  }

  let deleted = 0;
  for (const skill of skillsToDelete) {
    const dest = path.join(targetDir, skill);
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
      deleted += 1;
      console.log(`  - removed ${skill}`);
    } else {
      console.log(`  - skipped ${skill} (not installed)`);
    }
  }

  console.log(`✓ Deleted ${deleted} skill(s) from ${targetDir}`);
  return true;
}

function searchSkills(query, skillsSource = getSkillsSources()) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return getSkillEntries(skillsSource).filter((skill) => {
    return (
      skill.dir.toLowerCase().includes(normalized) ||
      skill.name.toLowerCase().includes(normalized)
    );
  });
}

function listGroups(skillsSource = getSkillsSources()) {
  const groups = getGroupEntries(skillsSource);

  console.log('\nAvailable groups:\n');
  for (const group of groups) {
    const suffix = group.description ? ` - ${group.description}` : '';
    console.log(`  • ${group.name}${suffix}`);
    console.log(`    skills: ${group.skills.join(', ')}`);
  }
  console.log();
}

function runMcpServer() {
  const mcpEntry = path.join(__dirname, 'mcp.mjs');
  const result = runtime.spawnSync(process.execPath, [mcpEntry], {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    console.error(`✗ Failed to start MCP server: ${result.error.message}`);
    return 1;
  }

  return typeof result.status === 'number' ? result.status : 0;
}

function parseArgs(argv) {
  const state = {
    command: 'install',
    all: false,
    project: false,
    projectRoot: null,
    wipeAll: false,
    help: false,
    list: false,
    listGroups: false,
    search: null,
    deleteMode: false,
    selectedSkills: [],
    selectedGroups: [],
    requestedTools: [],
    unknownOptions: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '-h' || arg === '--help') {
      state.help = true;
    } else if (
      arg === 'group' ||
      arg === 'find' ||
      arg === 'search' ||
      arg === 'list' ||
      arg === 'ls' ||
      arg === 'groups' ||
      arg === 'mcp' ||
      arg === 'update' ||
      arg === 'remove' ||
      arg === 'rm' ||
      arg === 'delete' ||
      arg === 'install' ||
      arg === 'add'
    ) {
      state.command =
        arg === 'search' ? 'find' : arg === 'delete' ? 'remove' : arg === 'groups' ? 'groups' : arg;
      if (state.command === 'ls') state.command = 'list';
      if (state.command === 'rm') state.command = 'remove';
      if (state.command === 'add') state.command = 'install';
      if (state.command === 'update') state.command = 'install';
    } else if (arg === '--list') {
      state.list = true;
    } else if (arg === '--groups') {
      state.listGroups = true;
    } else if (arg === '--delete') {
      state.deleteMode = true;
    } else if (arg === '--all') {
      state.all = true;
    } else if (arg === '--project') {
      state.project = true;
    } else if (arg === '--project-root') {
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        state.projectRoot = next;
        i += 1;
      }
    } else if (arg.startsWith('--project-root=')) {
      state.projectRoot = arg.slice('--project-root='.length);
    } else if (arg === '--everything') {
      state.wipeAll = true;
    } else if (arg === '--group' || arg === '--group=') {
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        state.selectedGroups.push(next);
        i += 1;
      }
    } else if (arg.startsWith('--group=')) {
      state.selectedGroups.push(arg.slice('--group='.length));
    } else if (arg === '--search' || arg === '-s') {
      const next = argv[i + 1];
      state.search = next && !next.startsWith('--') ? next : '';
      if (state.search) i += 1;
    } else if (arg.startsWith('--search=')) {
      state.search = arg.slice('--search='.length);
    } else if (arg.startsWith('--')) {
      const tool = arg.slice(2);
      if (Object.prototype.hasOwnProperty.call(TOOLS, tool)) {
        state.requestedTools.push(tool);
      } else {
        state.unknownOptions.push(arg);
      }
    } else {
      if (state.command === 'group' || state.command === 'groups') {
        state.selectedGroups.push(arg);
      } else {
        state.selectedSkills.push(arg);
      }
    }
  }

  return state;
}

function printHelp() {
  console.log(`
Usage: npx web-ui-skills [command] [options]

Options:
  --all        Install for all supported tools (default when no tool flag is given)
  --project    Install into project-local .codex/.claude/.copilot/.kilocode folders
  --project-root DIR  Set the project root used with --project
  --codex      Install to ~/.codex/skills
  --claude     Install to ~/.claude/skills
  --copilot    Install to ~/.copilot/skills
  --kilo       Install to ~/.kilocode/skills
  --list       List available skills and exit
  --group NAME Install one or more predefined groups
  --groups     List available groups and exit
  --search Q   Search available skills by folder or skill name
  --delete     Remove selected skills from the target tool directory
  --everything Remove every installed skill from the selected tool directories
  -h, --help   Show this help message

Commands:
  install      Install skills (default)
  update       Alias for install
  group        Install one or more named groups
  find         Search available skills
  list         List available skills
  groups       List available groups
  mcp          Start the local MCP server
  remove       Remove selected skills from the target tool directory
  ls           Alias for list
  rm           Alias for remove
  add          Alias for install
  search       Alias for find
  delete       Alias for remove

Examples:
  npx web-ui-skills                 # install for all tools
  npx web-ui-skills --codex         # install only for Codex
  npx web-ui-skills --claude        # install only for Claude Code
  npx web-ui-skills --codex --kilo  # install for Codex and Kilo
  npx web-ui-skills --project --codex preact-ui   # install into ./.codex/skills
  npx web-ui-skills preact-ui vue-ui # install only selected skills
  npx web-ui-skills group ui         # install a predefined group
  npx web-ui-skills --group ui       # install a group via flag
  npx web-ui-skills groups           # list predefined groups
  npx web-ui-skills find ui          # search matching skills
  npx web-ui-skills mcp              # start the local MCP server
  npx web-ui-skills --codex remove vue-ui    # remove a skill from a specific tool dir
  npx web-ui-skills remove --all vue-ui      # remove a skill from all tool dirs
  npx web-ui-skills remove --all --everything # remove all installed skills from all tool dirs
`);
}

function runCli(argv = process.argv.slice(2)) {
  const parsed = parseArgs(argv);
  const sourceRoot = parsed.projectRoot || process.cwd();
  const skillSources = getSkillsSources({ projectRoot: sourceRoot });

  if (parsed.help) {
    printHelp();
    return 0;
  }

  if (parsed.unknownOptions.length > 0) {
    console.error(`✗ Unknown option(s): ${parsed.unknownOptions.join(', ')}`);
    return 1;
  }

  if (parsed.command === 'find' || parsed.search !== null) {
    const query = parsed.search ?? parsed.selectedSkills.join(' ');
    const matches = searchSkills(query, skillSources);

    console.log(`\nMatching skills for "${query}":\n`);
    if (matches.length === 0) {
      console.log('  (none)\n');
    } else {
      matches.forEach((skill) => console.log(`  • ${skill.dir} (${skill.name})`));
      console.log();
    }
    return 0;
  }

  if (parsed.command === 'groups' || parsed.listGroups) {
    listGroups(skillSources);
    return 0;
  }

  if (parsed.command === 'mcp') {
    return runMcpServer();
  }

  const targetDirs = parsed.project
    ? resolveToolDirs({ project: true, projectRoot: parsed.projectRoot || process.cwd() })
    : TOOLS;

  if (parsed.command === 'list' || parsed.list) {
    const { skills, warnings } = validateSkillTree(skillSources);

    console.log('\nAvailable skills:\n');
    skills.forEach((skill) => console.log(`  • ${skill}`));
    if (warnings.length > 0) {
      console.log('\nWarnings:\n');
      warnings.forEach((warning) => console.log(`  ⚠ ${warning}`));
    }
    console.log();
    return 0;
  }

  const targetTools =
    parsed.requestedTools.length > 0 ? parsed.requestedTools : Object.keys(TOOLS);

  if (parsed.command === 'remove') {
    parsed.deleteMode = true;
  }

  if (parsed.deleteMode && parsed.requestedTools.length === 0 && !parsed.all) {
    console.error('✗ Use at least one tool flag (for example --codex) or --all with remove');
    return 1;
  }

  if (parsed.deleteMode && parsed.all && parsed.selectedSkills.length === 0 && parsed.selectedGroups.length === 0 && !parsed.wipeAll) {
    console.error('✗ Remove all tool scopes requires at least one skill/group name or --everything for a full wipe');
    return 1;
  }

  console.log('\n🚀 web-ui-skills installer\n');
  let ok = true;
  for (const tool of targetTools) {
    const action = parsed.deleteMode ? 'Deleting from' : 'Installing for';
    console.log(`${action} ${tool} → ${targetDirs[tool]}`);
    if (parsed.deleteMode) {
      const deleteAll = parsed.all && parsed.wipeAll && parsed.selectedSkills.length === 0 && parsed.selectedGroups.length === 0;
      if (!deleteForTool(tool, parsed.selectedSkills, parsed.selectedGroups, skillSources, targetDirs, deleteAll)) ok = false;
    } else if (!installForTool(tool, parsed.selectedSkills, parsed.selectedGroups, targetDirs, skillSources)) {
      ok = false;
    }
  }

  if (!ok) return 1;
  console.log('\n✅ Done!\n');
  return 0;
}

if (require.main === module) {
  process.exitCode = runCli();
}

module.exports = {
  TOOLS,
  copyDir,
  deleteForTool,
  expandSelectedGroups,
  filterSelectedSkills,
  findSkillFiles,
  getGroupEntries,
  getSkillEntries,
  getSkillsSource,
  getSkillsSources,
  getTopLevelSkills,
  getProjectSkillsSource,
  getUserSkillsSource,
  getMergedSkillEntries,
  getMergedTopLevelSkills,
  installForTool,
  parseArgs,
  printHelp,
  listGroups,
  readSkillName,
  readSkillMetadata,
  getSkillDetail,
  getAllSkillDetails,
  resolveToolDir,
  resolveProjectToolDir,
  resolveToolDirs,
  resolveRequestedSkills,
  runMcpServer,
  runCli,
  searchSkills,
  loadSkillGroups,
  loadSkillGroupsFromSource,
  loadMergedSkillGroups,
  syncOverlaySources,
  validateSkillTree,
  __test__: runtime,
};
