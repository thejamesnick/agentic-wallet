# 📦 Publishing PAW to npm

## Prerequisites

1. **npm Account**
   - Create account at https://www.npmjs.com/signup
   - Verify email

2. **npm Login**
   ```bash
   npm login
   # Enter username, password, email
   ```

3. **Organization (Optional)**
   - Create @pocketagent organization on npm
   - Or publish under your own username

## Pre-Publishing Checklist

### 1. Update Version

```bash
# Update version in package.json
# Follow semantic versioning: MAJOR.MINOR.PATCH

# For first release
"version": "1.0.0"

# For bug fixes
"version": "1.0.1"

# For new features
"version": "1.1.0"

# For breaking changes
"version": "2.0.0"
```

### 2. Build and Test

```bash
# Clean build
rm -rf dist/
yarn build

# Test CLI
node dist/cli/index.js --help

# Test commands
node dist/cli/index.js init test-agent
node dist/cli/index.js address test-agent
node dist/cli/index.js balance test-agent

# Clean up test
rm -rf ~/.paw/agents/test-agent
```

### 3. Verify Package Contents

```bash
# See what will be published
npm pack --dry-run

# Check package size
npm pack
ls -lh *.tgz
```

### 4. Update Documentation

- [ ] README.md has installation instructions
- [ ] CHANGELOG.md updated (if exists)
- [ ] Version number updated in package.json
- [ ] All examples work with new version

## Publishing Steps

### Option 1: Publish to npm (Public)

```bash
# Build
yarn build

# Publish
npm publish --access public

# If using scoped package (@pocketagent/paw)
npm publish --access public
```

### Option 2: Test Locally First

```bash
# Create tarball
npm pack

# Install locally in another project
cd /path/to/test-project
npm install /path/to/pocketagent-paw-1.0.0.tgz

# Test it
npx paw --help
```

### Option 3: Publish to GitHub Packages

```bash
# Add to package.json
"publishConfig": {
  "registry": "https://npm.pkg.github.com"
}

# Login to GitHub packages
npm login --registry=https://npm.pkg.github.com

# Publish
npm publish
```

## Post-Publishing

### 1. Verify Installation

```bash
# Install globally
npm install -g @pocketagent/paw

# Test
paw --help
paw init test-agent
```

### 2. Create Git Tag

```bash
# Tag the release
git tag v1.0.0
git push origin v1.0.0
```

### 3. Create GitHub Release

1. Go to https://github.com/thejamesnick/agentic-wallet/releases
2. Click "Create a new release"
3. Choose tag: v1.0.0
4. Title: "PAW v1.0.0 - First Release"
5. Description: Copy from CHANGELOG or write release notes
6. Publish release

### 4. Update Documentation

```bash
# Update README with npm install instructions
npm install -g @pocketagent/paw

# Update SKILLS.md
# Update examples
```

## Version Management

### Semantic Versioning

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes

### Version Commands

```bash
# Bump patch version (1.0.0 → 1.0.1)
npm version patch

# Bump minor version (1.0.0 → 1.1.0)
npm version minor

# Bump major version (1.0.0 → 2.0.0)
npm version major

# These commands:
# 1. Update package.json
# 2. Create git commit
# 3. Create git tag
```

## Troubleshooting

### Error: Package name already exists

```bash
# Change package name in package.json
"name": "@yourusername/paw"

# Or use different name
"name": "pocketagent-wallet"
```

### Error: Need to login

```bash
npm login
# Enter credentials
```

### Error: 403 Forbidden

```bash
# Check if you have permission to publish to @pocketagent
# Or publish under your own username
```

### Error: Package too large

```bash
# Check .npmignore
# Make sure node_modules/ is excluded
# Remove unnecessary files
```

## Package Stats

After publishing, check:

- **npm page**: https://www.npmjs.com/package/@pocketagent/paw
- **Downloads**: npm stats
- **Bundle size**: https://bundlephobia.com/package/@pocketagent/paw

## Maintenance

### Update Dependencies

```bash
# Check outdated packages
yarn outdated

# Update dependencies
yarn upgrade-interactive

# Test after updates
yarn build
yarn test
```

### Deprecate Old Versions

```bash
# Deprecate a version
npm deprecate @pocketagent/paw@1.0.0 "Please upgrade to 1.1.0"

# Unpublish (only within 72 hours)
npm unpublish @pocketagent/paw@1.0.0
```

## CI/CD (Future)

### GitHub Actions for Auto-Publish

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: yarn install
      - run: yarn build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Quick Reference

```bash
# Login
npm login

# Build
yarn build

# Test package
npm pack --dry-run

# Publish
npm publish --access public

# Verify
npm install -g @pocketagent/paw
paw --help

# Tag release
git tag v1.0.0
git push origin v1.0.0
```

## Package URLs

After publishing:

- **npm**: https://www.npmjs.com/package/@pocketagent/paw
- **GitHub**: https://github.com/thejamesnick/agentic-wallet
- **Docs**: https://github.com/thejamesnick/agentic-wallet#readme

---

**Ready to publish PAW to npm!** 📦🚀
