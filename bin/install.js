#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const SKILL_FILE = 'SKILL.md';

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

function installForTool(toolName) {
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

  fs.mkdirSync(targetDir, { recursive: true });

  let installed = 0;
  for (const skill of skills) {
    const src = path.join(skillsSource, skill);
    const dest = path.join(targetDir, skill);
    fs.rmSync(dest, { recursive: true, force: true });
    copyDir(src, dest);
    installed += 1;
  }

  console.log(`✓ Installed ${installed} skill(s) to ${targetDir}`);
  return true;
}

function printHelp() {
  console.log(`
Usage: npx web-ui-skills [options]

Options:
  --all        Install for all supported tools (default when no tool flag is given)
  --codex      Install to ~/.codex/skills
  --claude     Install to ~/.claude/skills
  --copilot    Install to ~/.copilot/skills
  --kilo       Install to ~/.kilocode/skills
  --list       List available skills and exit
  -h, --help   Show this help message

Examples:
  npx web-ui-skills                 # install for all tools
  npx web-ui-skills --codex         # install only for Codex
  npx web-ui-skills --claude        # install only for Claude Code
  npx web-ui-skills --codex --kilo  # install for Codex and Kilo
`);
}

const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) {
  printHelp();
  process.exit(0);
}

if (args.includes('--list')) {
  const { skills, warnings } = validateSkillTree();

  console.log('\nAvailable skills:\n');
  skills.forEach((skill) => console.log(`  • ${skill}`));
  if (warnings.length > 0) {
    console.log('\nWarnings:\n');
    warnings.forEach((warning) => console.log(`  ⚠ ${warning}`));
  }
  console.log();
  process.exit(0);
}

const requestedTools = Object.keys(TOOLS).filter((tool) => args.includes(`--${tool}`));
const targetTools = requestedTools.length > 0 ? requestedTools : Object.keys(TOOLS);

console.log('\n🚀 web-ui-skills installer\n');
let ok = true;
for (const tool of targetTools) {
  console.log(`Installing for ${tool} → ${TOOLS[tool]}`);
  if (!installForTool(tool)) ok = false;
}

if (!ok) process.exit(1);
console.log('\n✅ Done!\n');
