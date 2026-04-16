# Web UI Skills - Agent Configuration

This document describes how to configure AI agents and development tools to use the Web UI Skills bundle for building professional web applications.

## Overview

Web UI Skills is a curated collection of best practices and patterns for modern web development, packaged as skills for AI coding assistants. The skills cover frontend frameworks, backend APIs, deployment, testing, accessibility, and more.

## Supported Tools

The skills bundle supports installation to multiple AI coding tools:

- **GitHub Copilot** - AI pair programmer
- **Claude Desktop** - Anthropic's AI assistant
- **Codex** - OpenAI's code generation tool
- **Kilo** - Alternative AI coding assistant

## Installation

### Automated Installation (Recommended)

```bash
# Install to all supported tools
npx web-ui-skills

# Install to specific tools
npx web-ui-skills --codex --claude --copilot --kilo

# List available skills before installing
npx web-ui-skills --list
```

### Manual Installation

Clone the repository and run the installer:

```bash
git clone https://github.com/prachwal/web-ui-skills.git
cd web-ui-skills
node bin/install.js --codex --claude --copilot --kilo
```

## Agent Configuration

### GitHub Copilot

Skills are automatically loaded when Copilot is enabled in VS Code. The skills provide context-aware suggestions for:

- Component architecture patterns
- API design best practices
- Testing strategies
- Deployment configurations
- Accessibility guidelines

### Claude Desktop

Configure Claude to use skills by ensuring the skills directory is in the Claude configuration path:

```json
{
  "skills_path": "~/.claude/skills"
}
```

### Codex

Skills integrate with Codex through the skills directory structure. Codex will automatically discover and use patterns from the installed skills.

### Kilo

Similar to other tools, Kilo discovers skills from the configured skills directory.

## Development Workflow

### Making Changes

1. **Fork the repository** on GitHub
2. **Create a feature branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the contribution guidelines
4. **Test your changes** locally
5. **Commit your changes** with descriptive messages:
   ```bash
   git add .
   git commit -m "feat: add new skill for [feature]"
   ```
6. **Push your changes** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request** on GitHub

### Commit Message Convention

Use conventional commit format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Testing related changes
- `chore:` - Maintenance tasks

### Pull Request Process

1. Ensure your PR has a clear title and description
2. Reference any related issues
3. Ensure all tests pass
4. Get approval from maintainers
5. Merge using squash or rebase strategy

## Troubleshooting

### Git Push Issues

If you encounter "divergent branches" or "Updates were rejected" errors:

```bash
# Check branch status
git status

# Pull remote changes with merge (preserves both histories)
git pull --no-rebase

# If you prefer rebase (linear history)
git pull --rebase

# Force push if needed (use carefully!)
git push --force-with-lease
```

### Common Git Scenarios

**Divergent branches** (local and remote have different commits):
```bash
# Option 1: Merge (creates merge commit)
git pull --no-rebase

# Option 2: Rebase (linear history)
git pull --rebase

# Option 3: Reset to remote (loses local commits!)
git reset --hard origin/main
```

**Merge conflicts**:
```bash
# Abort merge/rebase
git merge --abort
# or
git rebase --abort

# Resolve conflicts manually, then:
git add <resolved-files>
git commit
```

**Stash changes before pull**:
```bash
git stash
git pull --rebase
git stash pop
```

### Branch Management

```bash
# Create feature branch
git checkout -b feature/my-feature

# Switch branches
git checkout main

# Delete merged branch
git branch -d feature/my-feature

# Delete unmerged branch
git branch -D feature/my-feature

# List all branches
git branch -a
```

### Syncing with Upstream

```bash
# Add upstream remote (if not exists)
git remote add upstream https://github.com/prachwal/web-ui-skills.git

# Fetch upstream changes
git fetch upstream

# Merge upstream main
git merge upstream/main
```

## CI/CD Troubleshooting

### GitLab CI Pipeline Issues

**Pipeline fails on test stage**:
- Check that all Markdown files are valid
- Ensure `npm ci` completes successfully
- Verify skill installation works in CI environment

**NPM publish fails**:
- Check `NPM_TOKEN` is set in GitLab CI variables
- Ensure package version is unique
- Verify package.json is valid

**Netlify deployment fails**:
- Check `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` are configured
- Ensure build commands work locally
- Verify netlify.toml configuration

### Local Testing Before Push

```bash
# Test skills installation
npm run list-skills

# Validate Markdown
find skills -name "*.md" -exec markdownlint {} \;

# Test package
npm pack --dry-run

# Run security audit
npm audit
```

### Release Process

The repository uses automated releases:

1. **Automatic**: Push to `main` triggers patch version bump
2. **Manual**: Use GitLab CI "release:create" job for custom versions
3. **Tagged releases**: Create GitHub release with matching tag (e.g., `v1.0.11`)

### Environment Variables for CI

Required GitLab CI variables:
- `NPM_TOKEN`: NPM publishing token
- `NETLIFY_AUTH_TOKEN`: Netlify API token
- `NETLIFY_SITE_ID`: Netlify site ID for docs deployment

## Repository Structure

```
web-ui-skills/
├── skills/                    # Individual skill definitions
│   ├── preact-ui/            # Preact component patterns
│   ├── scss-system/          # SCSS architecture
│   ├── web-performance/      # Performance optimization
│   └── ...                   # Other skills
├── bin/                      # Installation scripts
├── examples/                 # Usage examples
├── scripts/                  # Helper scripts
├── .github/workflows/        # CI/CD pipelines
└── package.json              # NPM package configuration
```

## Adding New Skills

### Skill Structure

Each skill must follow this structure:

```
skills/[skill-name]/
├── SKILL.md                 # Main skill documentation
└── references/              # Supporting documentation
    ├── topic1.md
    ├── topic2.md
    └── ...
```

### SKILL.md Format

```markdown
---
name: skill-name
description: Brief description of when to use this skill
---

# Skill Name

Detailed description and usage guidelines...

## Best Practices

- Practice 1
- Practice 2

## Examples

Code examples...
```

### Guidelines for New Skills

1. **Focus on web development** - Skills should be relevant to modern web application development
2. **Provide concrete examples** - Include code snippets and practical usage
3. **Follow existing patterns** - Maintain consistency with other skills
4. **Test thoroughly** - Ensure examples work and patterns are sound
5. **Document limitations** - Be clear about when not to use the skill

### Skill Categories

- **UI Frameworks** - Component patterns, state management
- **Styling** - CSS architecture, design systems
- **Backend** - API design, serverless functions
- **Quality** - Testing, accessibility, performance
- **DevOps** - Deployment, CI/CD, monitoring

## Limitations and Constraints

### Content Restrictions

- Skills must be original content or properly licensed
- No copyrighted material without permission
- Avoid platform-specific code that doesn't generalize
- Focus on evergreen web development practices

### Technical Constraints

- Skills should work across modern browsers and Node.js versions
- Prefer standards-compliant approaches
- Consider bundle size and performance implications
- Ensure accessibility best practices are included

### Maintenance

- Skills should be updated as technologies evolve
- Deprecated patterns should be clearly marked
- Breaking changes require migration guides
- Regular review of skill relevance and accuracy

## Testing

### Local Testing

```bash
# Test installation
npm run list-skills

# Test specific skill
node bin/install.js --list | grep "your-skill"
```

### CI/CD Testing

The repository uses GitHub Actions for automated testing:

- **npm-publish.yml** - Publishes to NPM on release
- **release-on-main.yml** - Creates releases from main branch

### Quality Checks

- All skills must have valid Markdown
- File paths must follow naming conventions
- Skills must be installable without errors
- Documentation must be clear and actionable

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Getting Help

- Open an issue for bugs or feature requests
- Use discussions for questions about usage
- Check existing skills for examples and patterns

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.