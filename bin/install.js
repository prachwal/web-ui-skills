#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const SKILL_FILE = 'SKILL.md';
const GROUPS_FILE = 'groups.json';

function resolveToolDir(toolName) {
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

function getGroupsSource(skillsSource = getSkillsSource()) {
  return path.join(skillsSource, GROUPS_FILE);
}

function hasSkillFile(dir) {
  return fs.existsSync(path.join(dir, SKILL_FILE));
}

function getTopLevelSkills(skillsSource = getSkillsSource()) {
  if (!fs.existsSync(skillsSource)) return [];

  return fs
    .readdirSync(skillsSource, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((skill) => hasSkillFile(path.join(skillsSource, skill)))
    .sort();
}

function getSkillEntries(skillsSource = getSkillsSource()) {
  return getTopLevelSkills(skillsSource).map((skill) => {
    const skillFile = path.join(skillsSource, skill, SKILL_FILE);
    return {
      dir: skill,
      name: readSkillName(skillFile) || skill,
      path: path.join(skillsSource, skill),
    };
  });
}

function loadSkillGroups(skillsSource = getSkillsSource()) {
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

function getGroupEntries(skillsSource = getSkillsSource()) {
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

function readSkillName(skillFile) {
  const content = fs.readFileSync(skillFile, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const nameMatch = match[1].match(/^name:\s*(.+)\s*$/m);
  return nameMatch ? nameMatch[1].trim().replace(/^['"]|['"]$/g, '') : null;
}

function validateSkillTree(skillsSource = getSkillsSource()) {
  const topLevelSkills = getTopLevelSkills(skillsSource);
  const warnings = [];

  for (const skill of topLevelSkills) {
    const skillFile = path.join(skillsSource, skill, SKILL_FILE);
    const skillName = readSkillName(skillFile);
    if (!skillName) {
      warnings.push(`Missing frontmatter name in ${path.relative(skillsSource, skillFile)}`);
    } else if (skillName !== skill) {
      warnings.push(`Skill directory/name mismatch: ${skill} uses name "${skillName}"`);
    }
  }

  const names = new Map();
  for (const skillFile of findSkillFiles(skillsSource)) {
    const skillName = readSkillName(skillFile);
    if (!skillName) continue;

    const relativePath = path.relative(skillsSource, skillFile);
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

function expandSelectedGroups(selectedGroups, skillsSource = getSkillsSource()) {
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

function filterSelectedSkills(skills, selectedSkills, skillsSource = getSkillsSource()) {
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

function resolveRequestedSkills(skills, selectedSkills, selectedGroups, skillsSource = getSkillsSource()) {
  const expandedGroups = expandSelectedGroups(selectedGroups, skillsSource);
  if (expandedGroups === null) return null;

  const combined = uniqueList([...(selectedSkills || []), ...expandedGroups]);
  return filterSelectedSkills(skills, combined, skillsSource);
}

function installForTool(toolName, selectedSkills = null, selectedGroups = null) {
  const targetDir = TOOLS[toolName];
  const skillsSource = getSkillsSource();

  if (!fs.existsSync(skillsSource)) {
    console.error(`✗ Skills source directory not found: ${skillsSource}`);
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

  let installed = 0;
  for (const skill of skillsToInstall) {
    const src = path.join(skillsSource, skill);
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
  skillsSource = getSkillsSource(),
  deleteAll = false,
) {
  const targetDir = TOOLS[toolName];
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

function searchSkills(query, skillsSource = getSkillsSource()) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return getSkillEntries(skillsSource).filter((skill) => {
    return (
      skill.dir.toLowerCase().includes(normalized) ||
      skill.name.toLowerCase().includes(normalized)
    );
  });
}

function listGroups(skillsSource = getSkillsSource()) {
  const groups = getGroupEntries(skillsSource);

  console.log('\nAvailable groups:\n');
  for (const group of groups) {
    const suffix = group.description ? ` - ${group.description}` : '';
    console.log(`  • ${group.name}${suffix}`);
    console.log(`    skills: ${group.skills.join(', ')}`);
  }
  console.log();
}

function parseArgs(argv) {
  const state = {
    command: 'install',
    all: false,
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
  npx web-ui-skills preact-ui vue-ui # install only selected skills
  npx web-ui-skills group ui         # install a predefined group
  npx web-ui-skills --group ui       # install a group via flag
  npx web-ui-skills groups           # list predefined groups
  npx web-ui-skills find ui          # search matching skills
  npx web-ui-skills --codex remove vue-ui    # remove a skill from a specific tool dir
  npx web-ui-skills remove --all vue-ui      # remove a skill from all tool dirs
  npx web-ui-skills remove --all --everything # remove all installed skills from all tool dirs
`);
}

function runCli(argv = process.argv.slice(2)) {
  const parsed = parseArgs(argv);

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
    const matches = searchSkills(query);

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
    listGroups();
    return 0;
  }

  if (parsed.command === 'list' || parsed.list) {
    const { skills, warnings } = validateSkillTree();

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
    console.log(`${action} ${tool} → ${TOOLS[tool]}`);
    if (parsed.deleteMode) {
      const deleteAll = parsed.all && parsed.wipeAll && parsed.selectedSkills.length === 0 && parsed.selectedGroups.length === 0;
      if (!deleteForTool(tool, parsed.selectedSkills, parsed.selectedGroups, getSkillsSource(), deleteAll)) ok = false;
    } else if (!installForTool(tool, parsed.selectedSkills, parsed.selectedGroups)) {
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
  getTopLevelSkills,
  installForTool,
  parseArgs,
  printHelp,
  listGroups,
  readSkillName,
  resolveToolDir,
  resolveRequestedSkills,
  runCli,
  searchSkills,
  loadSkillGroups,
  validateSkillTree,
};
