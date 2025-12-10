# Dependency Management Best Practices

**For**: DevOps agent  
**Purpose**: Comprehensive guide to npm dependency management, security updates, versioning, and auditing.

## Overview

Effective dependency management is critical for maintaining a secure, stable, and performant Node.js application. This guide covers npm best practices, package.json configuration, semantic versioning, security auditing, and troubleshooting common dependency issues.

## Package.json Structure

### Production vs Development Dependencies

```json
{
  "name": "ollama-dashboard",
  "version": "1.0.0",
  "dependencies": {
    "express": "4.19.0",        // Runtime dependency
    "axios": "1.7.0",            // Runtime dependency
    "systeminformation": "5.21.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",        // Development tool
    "jest": "^29.7.0",          // Testing framework
    "supertest": "^6.3.3"       // API testing
  },
  "engines": {
    "node": ">=18.0.0",         // Minimum Node.js version
    "npm": ">=9.0.0"            // Minimum npm version
  }
}
```

**Key Principles**:
- **dependencies**: Required for production runtime
- **devDependencies**: Only needed for development/testing
- **engines**: Specify minimum Node.js/npm versions
- **Keep lists alphabetically sorted** for readability

### Version Pinning Strategy

**Exact Versions (Recommended for Production)**:
```json
{
  "dependencies": {
    "express": "4.19.0",  // Exact version - most stable
    "axios": "1.7.0"      // No automatic updates
  }
}
```

**Caret (^) - Minor Updates**:
```json
{
  "devDependencies": {
    "nodemon": "^3.0.1",  // Allows 3.x.x updates
    "jest": "^29.7.0"     // Allows 29.x.x updates
  }
}
```

**Tilde (~) - Patch Updates**:
```json
{
  "dependencies": {
    "some-lib": "~2.4.3"  // Allows 2.4.x updates only
  }
}
```

**When to Use Each**:
- **Exact (`4.19.0`)**: Production dependencies, libraries with frequent breaking changes
- **Caret (`^3.0.1`)**: Development dependencies, stable libraries
- **Tilde (`~2.4.3`)**: When you want bugfixes but fear breaking changes

## Semantic Versioning (SemVer)

### Version Format: MAJOR.MINOR.PATCH

```
1.2.3
│ │ └─ PATCH: Bugfixes (backwards compatible)
│ └─── MINOR: New features (backwards compatible)
└───── MAJOR: Breaking changes (NOT backwards compatible)
```

### Version Ranges

```json
{
  "dependencies": {
    "package-a": "1.2.3",      // Exact version
    "package-b": "^1.2.3",     // >=1.2.3 <2.0.0
    "package-c": "~1.2.3",     // >=1.2.3 <1.3.0
    "package-d": ">=1.2.3",    // Any version ≥ 1.2.3
    "package-e": "<2.0.0",     // Any version < 2.0.0
    "package-f": "1.2.x",      // 1.2.0, 1.2.1, 1.2.2, etc.
    "package-g": "*"           // Latest (AVOID!)
  }
}
```

**Best Practice**: Use exact versions or caret for predictability.

## Installing and Updating Dependencies

### Initial Installation

```bash
# Install all dependencies from package.json
npm install

# Install production dependencies only
npm install --production
npm ci --production  # Cleaner install from lockfile
```

### Adding New Dependencies

```bash
# Add production dependency (exact version)
npm install express@4.19.0 --save-exact

# Add development dependency (caret version)
npm install --save-dev nodemon

# Add with specific version range
npm install axios@^1.7.0
```

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update all packages (respecting semver ranges)
npm update

# Update specific package to latest
npm update express

# Install latest version (ignoring semver range)
npm install express@latest

# Interactive update tool
npx npm-check-updates -i
```

### Removing Dependencies

```bash
# Remove dependency and update package.json
npm uninstall express

# Remove unused dependencies
npm prune
```

## Security Auditing

### Running Security Audits

```bash
# Check for vulnerabilities
npm audit

# Audit production dependencies only
npm audit --production

# Get JSON output for automation
npm audit --json

# Audit specific severity levels
npm audit --audit-level=moderate
```

### Sample Audit Output

```
# npm audit report

axios  <=1.5.1
Severity: moderate
Inefficient Regular Expression Complexity in axios - https://github.com/advisories/GHSA-wf5p-g6vw-rhxx
No fix available
node_modules/axios

2 moderate severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force
```

### Fixing Vulnerabilities

```bash
# Auto-fix vulnerabilities (safe updates only)
npm audit fix

# Force fix (may include breaking changes)
npm audit fix --force

# Dry run to see what would be fixed
npm audit fix --dry-run
```

**Caution with `--force`**:
- May install major version updates
- Can introduce breaking changes
- Always test after force fixes
- Review changes before committing

### Manual Vulnerability Resolution

```bash
# 1. Check which package needs updating
npm audit

# 2. Update specific package
npm update axios

# 3. If still vulnerable, install specific version
npm install axios@1.7.0 --save-exact

# 4. If no fix available, consider alternatives
npm uninstall vulnerable-package
npm install safe-alternative
```

## Package Lock Files

### Understanding package-lock.json

**Purpose**:
- Locks exact versions of entire dependency tree
- Ensures consistent installs across environments
- Improves installation speed
- Critical for reproducible builds

**Never**:
- ❌ Delete package-lock.json
- ❌ Add to .gitignore
- ❌ Manually edit

**Always**:
- ✅ Commit to version control
- ✅ Let npm manage automatically
- ✅ Use `npm ci` in CI/CD

### npm install vs npm ci

```bash
# npm install (local development)
npm install
# - Uses package.json as source of truth
# - Updates package-lock.json if needed
# - Slower but flexible

# npm ci (CI/CD pipelines)
npm ci
# - Uses package-lock.json as source of truth
# - Deletes node_modules first (clean install)
# - Faster and deterministic
# - Fails if package.json and lock file are out of sync
```

**Best Practice**: Use `npm ci` in CI/CD, `npm install` locally.

## Dependency Resolution Issues

### Conflicting Peer Dependencies

**Problem**:
```
npm ERR! peer dep missing: react@^18.0.0, required by some-react-component@2.0.0
```

**Solution**:
```bash
# Install missing peer dependency
npm install react@18.0.0

# Force install (legacy behavior, not recommended)
npm install --legacy-peer-deps
```

### Version Conflicts

**Problem**:
```
Package A requires lodash@^4.17.0
Package B requires lodash@^3.10.0
```

**Solutions**:
1. **Update dependencies**: Try updating A or B to compatible versions
2. **Use npm overrides** (npm 8.3+):
   ```json
   {
     "overrides": {
       "lodash": "4.17.21"
     }
   }
   ```
3. **Contact maintainers**: Report incompatibility

### Ghost Dependencies

**Problem**: Package works locally but fails in production

**Cause**: Accidentally using dependency not listed in package.json

**Solution**:
```bash
# Test with clean install
rm -rf node_modules package-lock.json
npm install

# If failure, add missing dependency
npm install missing-package --save-exact
```

### Disk Space Issues

```bash
# Clear npm cache
npm cache clean --force

# Remove duplicate packages
npm dedupe

# Analyze dependency tree size
npx npm-check -u
```

## Monorepo and Workspace Management

### npm Workspaces

**package.json (root)**:
```json
{
  "name": "monorepo-root",
  "workspaces": [
    "packages/*"
  ]
}
```

**Install all workspace dependencies**:
```bash
npm install
```

**Add dependency to specific workspace**:
```bash
npm install express --workspace=packages/backend
```

## Advanced npm Commands

### Listing Dependencies

```bash
# List all dependencies (tree view)
npm list

# List production dependencies only
npm list --prod

# List top-level dependencies only
npm list --depth=0

# Find where a package is used
npm list express
```

### Viewing Package Info

```bash
# View package metadata
npm view express

# View specific version info
npm view express@4.19.0

# View all available versions
npm view express versions

# View package dependencies
npm view express dependencies
```

### Publishing and Versioning

```bash
# Bump patch version (1.0.0 → 1.0.1)
npm version patch

# Bump minor version (1.0.0 → 1.1.0)
npm version minor

# Bump major version (1.0.0 → 2.0.0)
npm version major

# Custom version
npm version 2.5.3

# Publish to npm registry
npm publish
```

## Best Practices Checklist

### Before Adding Dependencies

- [ ] Is this dependency necessary?
- [ ] Is the package actively maintained?
- [ ] Check package size (use [bundlephobia.com](https://bundlephobia.com))
- [ ] Review package reputation (downloads, GitHub stars, issues)
- [ ] Check for security advisories
- [ ] Consider bundle impact on frontend packages

### Regular Maintenance

- [ ] Run `npm audit` weekly
- [ ] Review `npm outdated` monthly
- [ ] Update devDependencies regularly (less risky)
- [ ] Update production dependencies carefully (test thoroughly)
- [ ] Keep package-lock.json committed
- [ ] Document breaking changes in CHANGELOG

### Security

- [ ] Pin exact versions for production dependencies
- [ ] Never commit node_modules to git
- [ ] Use `npm ci` in CI/CD pipelines
- [ ] Review dependency licenses (use `license-checker`)
- [ ] Set up automated dependency updates (Dependabot/Renovate)

## Common Pitfalls

### 1. Using `npm install --save` (Outdated)

**Problem**: Modern npm (5+) adds to package.json automatically

**Solution**:
```bash
# Just use npm install
npm install express
```

### 2. Not Committing package-lock.json

**Problem**: Different developers get different dependency versions

**Solution**: Always commit `package-lock.json`

### 3. Using `npm audit fix --force` Blindly

**Problem**: Can introduce breaking changes

**Solution**:
```bash
# Review changes first
npm audit fix --dry-run

# Test after force fixes
npm audit fix --force
npm test
```

### 4. Global Dependencies in Projects

**Problem**:
```bash
npm install -g some-tool
```

**Solution**: Use local dependencies and npm scripts
```json
{
  "devDependencies": {
    "some-tool": "^1.0.0"
  },
  "scripts": {
    "tool": "some-tool"
  }
}
```

### 5. Deleting node_modules to "Fix" Issues

**Problem**: Masks underlying problems

**Better Approach**:
```bash
# Clean install
npm ci

# If that doesn't work, investigate root cause
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Loading Instructions

**When to load this context:**
- Adding, updating, or removing npm dependencies
- Resolving security vulnerabilities
- Troubleshooting dependency conflicts
- Setting up new project dependencies
- Upgrading major versions of dependencies
- Investigating build issues related to dependencies

**How to load:**
```bash
read .opencode/context/devops/dependency-management.md
```

## Summary

**Key Takeaways:**
- Pin production dependencies to exact versions
- Use `npm ci` in CI/CD for reproducible builds
- Run `npm audit` regularly and fix vulnerabilities promptly
- Always commit package-lock.json
- Update dependencies incrementally and test thoroughly
- Use semantic versioning to understand update impact

**Goal**: Maintain a secure, stable, and up-to-date dependency tree that enables rapid development without unexpected breakage.
