# How to Create and Publish AI Agent Skills

A comprehensive guide to creating, structuring, and publishing skills for the Vercel Skills ecosystem.

## Table of Contents

- [What Are AI Agent Skills?](#what-are-ai-agent-skills)
- [The Skills Ecosystem](#the-skills-ecosystem)
- [Skill Structure](#skill-structure)
- [Creating Your First Skill](#creating-your-first-skill)
- [SKILL.md Format](#skillmd-format)
- [Progressive Disclosure](#progressive-disclosure)
- [Publishing Your Skills](#publishing-your-skills)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## What Are AI Agent Skills?

AI Agent Skills are reusable instruction packages that teach AI coding assistants how to perform specific tasks. Think of them as "npm for AI agents" - standardized, shareable capabilities that work across multiple AI coding tools.

**Key Benefits:**
- **Reusable**: Write once, use across projects
- **Shareable**: Distribute via npm or GitHub
- **Agent-agnostic**: Works with 18+ AI coding tools (Claude, Cursor, Copilot, etc.)
- **Token-efficient**: Progressive loading saves context space
- **Community-driven**: Discover and share on [skills.sh](https://skills.sh)

---

## The Skills Ecosystem

**Created by**: Vercel (January 2026)

**Standard**: Open specification at [agentskills.io](https://agentskills.io)

**Compatible Tools**:
- Claude Code
- Cursor
- GitHub Copilot
- Windsurf
- Codex
- And 13+ more

**Security**: Partnership with Snyk for vulnerability scanning

**Discovery**: Automatic listing on [skills.sh](https://skills.sh) via install telemetry

---

## Skill Structure

A skill package is a Git repository with the following structure:

```
my-skills-package/
├── README.md                    # Package documentation
├── package.json                 # npm package config (optional but recommended)
├── .gitignore                   # Git ignore rules
└── skills/                      # Skills directory
    ├── skill-one/
    │   ├── SKILL.md            # Required: Main skill file
    │   ├── scripts/            # Optional: Executable helpers
    │   │   ├── setup.sh
    │   │   └── helper.py
    │   ├── references/         # Optional: Detailed docs (loaded on-demand)
    │   │   ├── ADVANCED.md
    │   │   └── EXAMPLES.md
    │   └── assets/             # Optional: Templates, data files
    │       └── template.json
    └── skill-two/
        └── SKILL.md
```

---

## Creating Your First Skill

### Step 1: Initialize Your Repository

```bash
# Create a new directory
mkdir my-ai-skills
cd my-ai-skills

# Initialize git
git init

# Create the skills directory
mkdir -p skills/my-first-skill
```

### Step 2: Create package.json (Optional but Recommended)

```json
{
  "name": "@your-org/my-ai-skills",
  "version": "1.0.0",
  "description": "My collection of AI agent skills",
  "keywords": ["ai", "agent", "skills", "coding-assistant"],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/my-ai-skills.git"
  },
  "files": ["skills/**/*"]
}
```

### Step 3: Create Your First SKILL.md

See the [SKILL.md Format](#skillmd-format) section below.

---

## SKILL.md Format

Every skill requires a `SKILL.md` file with YAML frontmatter and markdown instructions.

### Minimal Example

```yaml
---
name: my-skill
description: What this skill does and when to use it
---

# My Skill

## When to Use
Describe when this skill should be activated.

## Steps
1. First step
2. Second step
3. Third step
```

### Complete Example with All Fields

```yaml
---
name: python-testing
description: >-
  Best practices for writing Python tests with pytest.
  Use when user asks about testing, pytest, unit tests, or test coverage.
license: MIT
compatibility: Requires Python 3.8+ and pytest
metadata:
  author: Your Name
  version: "1.0.0"
  category: testing
internal: false
allowed-tools: Read Bash Edit
---

# Python Testing with pytest

<!-- 
  Best Practice: Keep this SKILL.md file under 500 lines for optimal token efficiency.
  Move detailed documentation to references/ and load them on-demand.
-->

## When to Use

Use this skill when the user wants to:
- Write new Python tests
- Run existing tests
- Debug failing tests
- Set up test coverage reporting
- Configure pytest

## Input Requirements

- Python project with a `tests/` directory
- pytest installed (will install if missing)
- Test files following `test_*.py` or `*_test.py` naming convention

## Step-by-Step Procedure

### Step 1: Verify pytest Installation

Check if pytest is installed:
```bash
pip list | grep pytest
```

If not installed:
```bash
pip install pytest pytest-cov
```

### Step 2: Run Tests

Run all tests with verbose output:
```bash
pytest -v
```

Run specific test file:
```bash
pytest tests/test_module.py -v
```

Run tests matching a pattern:
```bash
pytest -k "test_user" -v
```

### Step 3: Generate Coverage Report

Run tests with coverage:
```bash
pytest --cov=src tests/
```

Generate HTML coverage report:
```bash
pytest --cov=src --cov-report=html tests/
```

## Validation

Tests completed successfully when:
- All tests pass (green output)
- Coverage meets project requirements (typically 80%+)
- No import errors or fixture issues

## Common Failure Modes

### Import Errors

**Problem**: `ModuleNotFoundError` when running tests

**Solution**: 
- Ensure `__init__.py` exists in test directories
- Check PYTHONPATH includes src directory
- Install package in editable mode: `pip install -e .`

### Fixture Not Found

**Problem**: `fixture 'my_fixture' not found`

**Solution**:
- Check `conftest.py` location (should be in tests/ root)
- Verify fixture name spelling
- Ensure fixture has `@pytest.fixture` decorator

### Slow Tests

**Problem**: Tests take too long to run

**Solution**:
- Use pytest markers to skip slow tests: `pytest -m "not slow"`
- Run tests in parallel: `pytest -n auto` (requires pytest-xdist)
- Mock external dependencies

## References

- See [advanced pytest features](references/ADVANCED.md) for fixtures, parametrization, and mocking
- Run [test setup script](scripts/setup-tests.sh) to configure pytest automatically
- Check [example tests](references/EXAMPLES.md) for common patterns
```

### YAML Frontmatter Fields

| Field | Required | Format | Description |
|-------|----------|--------|-------------|
| `name` | ✅ Yes | 1-64 chars, lowercase, hyphens only | Must match folder name |
| `description` | ✅ Yes | 1-1024 chars | Include trigger keywords for discovery |
| `license` | ❌ No | String | e.g., MIT, Apache-2.0 |
| `compatibility` | ❌ No | Max 500 chars | System requirements |
| `metadata` | ❌ No | Key-value pairs | Custom fields (author, version, etc.) |
| `internal` | ❌ No | Boolean | Set `true` to hide from public discovery |
| `allowed-tools` | ❌ No | Space-separated list | Pre-approved tools (experimental) |

### Markdown Sections (Recommended Structure)

1. **When to Use**: Trigger conditions and use cases
2. **Input Requirements**: Prerequisites, files needed, setup
3. **Step-by-Step Procedure**: Detailed instructions for the AI agent
4. **Validation**: How to verify success
5. **Common Failure Modes**: Troubleshooting guide
6. **References**: Links to external files for on-demand loading

---

## Progressive Disclosure

Skills are designed for **token efficiency** through progressive loading:

### Loading Stages

1. **Startup** (~30-50 tokens)
   - Only `name` + `description` from YAML frontmatter load
   - Agent can see what skills are available without loading full content

2. **Activation** (full SKILL.md)
   - When skill is triggered, complete `SKILL.md` loads into context
   - Agent has full instructions to execute the task

3. **Execution** (on-demand)
   - `references/` files load only when explicitly referenced
   - `scripts/` execute only when called
   - `assets/` load only when needed

### Best Practices for Token Efficiency

✅ **DO:**
- Keep `SKILL.md` under 500 lines
- Put detailed docs in `references/` and reference them: "See [advanced guide](references/ADVANCED.md)"
- Use `scripts/` for automation instead of embedding long code blocks
- Include rich trigger keywords in description for better discovery

❌ **DON'T:**
- Put everything in `SKILL.md` (defeats progressive loading)
- Embed large code examples (link to `references/` or `assets/` instead)
- Use vague descriptions (agent won't know when to activate)

### Example: Progressive Structure

```
skills/database-migration/
├── SKILL.md                    # ~200 lines: core workflow
├── references/
│   ├── POSTGRES.md            # Postgres-specific details
│   ├── MYSQL.md               # MySQL-specific details
│   └── ROLLBACK.md            # Rollback procedures
├── scripts/
│   ├── backup.sh              # Automated backup
│   └── migrate.py             # Migration runner
└── assets/
    └── migration-template.sql # SQL template
```

In `SKILL.md`:
```markdown
## Database-Specific Instructions

- For PostgreSQL: See [Postgres guide](references/POSTGRES.md)
- For MySQL: See [MySQL guide](references/MYSQL.md)

## Rollback Procedure

If migration fails, see [rollback guide](references/ROLLBACK.md)

## Automation

Run [backup script](scripts/backup.sh) before migration
```

---

## Publishing Your Skills

### Option 1: Publish to npm (Recommended)

**Benefits:**
- Easy installation via `npx skills add @org/package`
- Version management
- Automatic discovery on skills.sh
- Professional distribution

**Steps:**

1. **Prepare package.json**:
```json
{
  "name": "@your-org/my-skills",
  "version": "1.0.0",
  "description": "My AI agent skills",
  "keywords": ["ai", "agent", "skills"],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/my-skills.git"
  },
  "files": ["skills/**/*"]
}
```

2. **Login to npm**:
```bash
npm login
```

3. **Publish**:
```bash
npm publish --access public
```

4. **Update versions**:
```bash
# Update version in package.json
npm version patch  # or minor, or major

# Publish new version
npm publish
```

**Installation by users**:
```bash
npx skills add @your-org/my-skills
```

### Option 2: GitHub Only (No npm)

**Benefits:**
- No npm account needed
- Simpler workflow
- Still works with skills CLI

**Steps:**

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/my-skills.git
git push -u origin main
```

2. **Users install directly**:
```bash
npx skills add your-username/my-skills
```

### Discovery on skills.sh

**Automatic listing**: No manual submission required!

- Skills appear on [skills.sh](https://skills.sh) via install telemetry
- More installs = higher ranking on leaderboard
- Works for both npm and GitHub distribution

**How to rank higher:**
- Write clear, useful skills
- Include rich trigger keywords in descriptions
- Share your skills on social media, forums, blogs
- Contribute to open source projects using your skills

---

## Best Practices

### Writing Effective Skills

1. **Clear Trigger Keywords**
   - Include specific terms in description that match user queries
   - Example: "pytest, testing, unit tests, coverage, TDD"

2. **Actionable Instructions**
   - Write step-by-step procedures the AI can follow
   - Use imperative language: "Check if...", "Run...", "Verify..."
   - Include actual commands and code snippets

3. **Handle Edge Cases**
   - Document common failure modes
   - Provide troubleshooting steps
   - Include validation checks

4. **Progressive Disclosure**
   - Keep main SKILL.md focused and scannable
   - Move detailed content to references/
   - Use scripts/ for automation

5. **Version Your Skills**
   - Use semantic versioning in metadata
   - Document breaking changes
   - Maintain backwards compatibility when possible

### Naming Conventions

**Skill names** (folder and YAML `name` field):
- Lowercase only
- Use hyphens for spaces: `python-testing`
- Be specific: `react-component-testing` not just `testing`
- 1-64 characters
- Must match folder name exactly

**File names**:
- `SKILL.md` - uppercase, required
- `references/` - descriptive names: `ADVANCED.md`, `EXAMPLES.md`
- `scripts/` - lowercase with extension: `setup.sh`, `helper.py`

### Testing Your Skills

Before publishing, test your skills:

1. **Install locally**:
```bash
npx skills add ./path/to/your-skills
```

2. **Try with your AI coding tool**:
   - Trigger the skill with relevant keywords
   - Verify it loads and executes correctly
   - Check that references/ and scripts/ work

3. **Get feedback**:
   - Share with colleagues
   - Test on different projects
   - Iterate based on real usage

---

## Examples

### Example 1: Simple Skill (No External Files)

```yaml
---
name: git-commit-message
description: >-
  Generate conventional commit messages following best practices.
  Use when user asks about commit messages, git commits, or conventional commits.
---

# Git Commit Messages

## When to Use
When the user needs help writing a git commit message.

## Steps

1. Ask user what changes they made
2. Determine commit type:
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation
   - `style`: Formatting
   - `refactor`: Code restructuring
   - `test`: Adding tests
   - `chore`: Maintenance

3. Format as: `type(scope): description`
   - Example: `feat(auth): add password reset functionality`

4. Keep description under 50 characters
5. Use imperative mood: "add" not "added"

## Validation
- Message follows conventional commit format
- Description is clear and concise
- Type is appropriate for the changes
```

### Example 2: Complex Skill (With References and Scripts)

```
skills/docker-deployment/
├── SKILL.md
├── references/
│   ├── KUBERNETES.md
│   ├── DOCKER-COMPOSE.md
│   └── TROUBLESHOOTING.md
├── scripts/
│   ├── build.sh
│   └── deploy.sh
└── assets/
    ├── Dockerfile.template
    └── docker-compose.yml.template
```

**SKILL.md**:
```yaml
---
name: docker-deployment
description: >-
  Deploy applications using Docker and Docker Compose.
  Use for containerization, docker, deployment, kubernetes, docker-compose.
metadata:
  author: DevOps Team
  version: "2.1.0"
---

# Docker Deployment

## When to Use
When deploying applications with Docker or Kubernetes.

## Steps

### Step 1: Choose Deployment Method
- Simple apps: Docker Compose (see [guide](references/DOCKER-COMPOSE.md))
- Production: Kubernetes (see [guide](references/KUBERNETES.md))

### Step 2: Build Container
Run [build script](scripts/build.sh) or manually:
```bash
docker build -t myapp:latest .
```

### Step 3: Deploy
Run [deploy script](scripts/deploy.sh) with environment:
```bash
./scripts/deploy.sh production
```

## Troubleshooting
See [troubleshooting guide](references/TROUBLESHOOTING.md)
```

### Example 3: Language-Specific Skill

```yaml
---
name: rust-error-handling
description: >-
  Best practices for error handling in Rust using Result and Option types.
  Use for rust errors, error handling, result type, option type, unwrap, expect.
---

# Rust Error Handling

## When to Use
When working with Rust error handling, Result, Option, or error propagation.

## Core Principles

1. **Prefer Result<T, E> over panic**
   - Use `Result` for recoverable errors
   - Reserve `panic!` for unrecoverable errors

2. **Use ? operator for propagation**
   ```rust
   fn read_file() -> Result<String, io::Error> {
       let content = fs::read_to_string("file.txt")?;
       Ok(content)
   }
   ```

3. **Avoid unwrap() in production**
   - Use `unwrap()` only in examples/tests
   - Use `expect()` with descriptive message if you must
   - Better: handle errors explicitly

4. **Custom error types**
   ```rust
   #[derive(Debug)]
   enum MyError {
       IoError(io::Error),
       ParseError(String),
   }
   ```

## Common Patterns

### Pattern 1: Convert Option to Result
```rust
let value = option_value.ok_or("Value not found")?;
```

### Pattern 2: Map errors
```rust
file.read_to_string(&mut contents)
    .map_err(|e| MyError::IoError(e))?;
```

### Pattern 3: Early return
```rust
let Some(value) = optional else {
    return Err("Missing value");
};
```

## Validation
- No `unwrap()` in production code
- All errors properly propagated or handled
- Error messages are descriptive
```

---

## Additional Resources

- **Official Spec**: [agentskills.io](https://agentskills.io)
- **Skill Registry**: [skills.sh](https://skills.sh)
- **Vercel Blog**: Announcements and updates
- **Community**: GitHub discussions and issues

---

## Quick Reference

### Skill Checklist

- [ ] Created `skills/skill-name/` directory
- [ ] Added `SKILL.md` with YAML frontmatter
- [ ] Name matches folder name (lowercase, hyphens)
- [ ] Description includes trigger keywords
- [ ] Instructions are clear and actionable
- [ ] Under 500 lines (moved details to references/)
- [ ] Tested locally with AI coding tool
- [ ] Added to package.json files array
- [ ] Published to npm or pushed to GitHub
- [ ] Shared with community

### Common Commands

```bash
# Install from npm
npx skills add @org/package

# Install from GitHub
npx skills add username/repo

# Install specific skill
npx skills add username/repo --skill skill-name

# Install locally for testing
npx skills add ./path/to/skills

# Publish to npm
npm publish --access public

# Update version
npm version patch && npm publish
```

---

**Happy skill building! 🚀**
