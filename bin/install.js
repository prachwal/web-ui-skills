#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// ── skill list ────────────────────────────────────────────────────────────────
const SKILLS = [
  'preact-ui',
  'scss-system',
  'web-accessibility-standards',
  'a11y-review',
  'web-performance',
  'web-i18n',
  'web-testing',
  'web-security',
  'netlify-serverless',
];

// ── tool → target directory ───────────────────────────────────────────────────
const TOOLS = {
  codex:   path.join(os.homedir(), '.codex',    'skills'),
  claude:  path.join(os.homedir(), '.claude',   'skills'),
  copilot: path.join(os.homedir(), '.copilot',  'skills'),
  kilo:    path.join(os.homedir(), '.kilocode', 'skills'),
};

// ── helpers ───────────────────────────────────────────────────────────────────
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src,  entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function installSkills(toolName, targetDir) {
  const skillsSource = path.join(__dirname, '..', 'skills');

  if (!fs.existsSync(skillsSource)) {
    console.error(`  ✗ Skills source directory not found: ${skillsSource}`);
    return false;
  }

  let installed = 0;
  for (const skill of SKILLS) {
    const src  = path.join(skillsSource, skill);
    const dest = path.join(targetDir, skill);
    if (!fs.existsSync(src)) {
      console.warn(`  ⚠ Skill not found, skipping: ${skill}`);
      continue;
    }
    // Remove old version then copy fresh
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    copyDir(src, dest);
    installed++;
  }

  console.log(`  ✓ Installed ${installed} skill(s) to ${targetDir}`);
  return true;
}

// ── argument parsing ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
Usage:  npx web-ui-skills [options]

Options:
  --all        Install for all supported tools (default when no tool flag given)
  --codex      Install to ~/.codex/skills
  --claude     Install to ~/.claude/skills
  --copilot    Install to ~/.copilot/skills
  --kilo       Install to ~/.kilocode/skills
  --list       List available skills and exit
  -h, --help   Show this help message

Examples:
  npx web-ui-skills                 # install for all tools
  npx web-ui-skills --claude        # install only for Claude Code
  npx web-ui-skills --codex --kilo  # install for Codex and Kilo
`);
  process.exit(0);
}

if (args.includes('--list')) {
  console.log('\nAvailable skills:\n');
  SKILLS.forEach(s => console.log(`  • ${s}`));
  console.log();
  process.exit(0);
}

// Determine which tools the user wants
const requestedTools = Object.keys(TOOLS).filter(t => args.includes(`--${t}`));
const targetTools = requestedTools.length > 0 ? requestedTools : Object.keys(TOOLS);

// ── main ──────────────────────────────────────────────────────────────────────
console.log('\n🚀 web-ui-skills installer\n');

let ok = true;
for (const tool of targetTools) {
  const targetDir = TOOLS[tool];
  console.log(`Installing for ${tool} → ${targetDir}`);
  if (!installSkills(tool, targetDir)) {
    ok = false;
  }
}

if (ok) {
  console.log('\n✅ Done!\n');
} else {
  console.error('\n⚠ Installation completed with warnings.\n');
  process.exit(1);
}
