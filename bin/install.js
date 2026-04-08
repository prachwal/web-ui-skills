#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const SKILLS = [
  'preact-ui',
  'scss-system',
  'web-accessibility-standards',
  'a11y-review',
  'web-performance',
  'web-i18n',
  'web-testing',
  'web-security',
];

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

function installForTool(toolName) {
  const targetDir = TOOLS[toolName];
  const skillsSource = path.join(__dirname, '..', 'skills');

  if (!fs.existsSync(skillsSource)) {
    console.error(`✗ Skills source directory not found: ${skillsSource}`);
    return false;
  }

  fs.mkdirSync(targetDir, { recursive: true });

  let installed = 0;
  for (const skill of SKILLS) {
    const src = path.join(skillsSource, skill);
    const dest = path.join(targetDir, skill);
    if (!fs.existsSync(src)) {
      console.warn(`⚠ Skill not found, skipping: ${skill}`);
      continue;
    }
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
  console.log('\nAvailable skills:\n');
  SKILLS.forEach((skill) => console.log(`  • ${skill}`));
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
