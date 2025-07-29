# 📦 GitHub Packages Guide

This guide explains how to publish and install the `@neatsuite` packages using [GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry).

## 🚀 Publishing Packages

### Automated Publishing (Recommended)

**GitHub Actions Workflow**: The repository includes a GitHub Action that automatically publishes packages to GitHub Packages.

- **Trigger Options:**
  - 🏷️ **On Release**: Automatically publishes when you create a GitHub release
  - 🔄 **Manual**: Use "Actions" tab → "Publish to GitHub Packages" → "Run workflow"
  - 📝 **On Push**: Optionally publish on pushes to `main` (currently disabled)

**Manual Triggers:**
```bash
# Go to GitHub Actions tab
# Select "Publish to GitHub Packages" 
# Click "Run workflow"
# Choose which packages to publish
```

### Local Publishing

**Prerequisites:**
- GitHub Personal Access Token with `write:packages` scope
- Token set as environment variable or in `.npmrc`

**Setup Token:**
```bash
# Option 1: Environment variable
export GITHUB_TOKEN="ghp_your_token_here"

# Option 2: Add to .npmrc
echo "//npm.pkg.github.com/:_authToken=ghp_your_token_here" >> ~/.npmrc
```

**Publish Commands:**
```bash
# Test publish (dry run)
npm run publish:github-packages -- --dry-run

# Publish to GitHub Packages
npm run publish:github-packages

# Skip confirmation prompts
npm run publish:github-packages -- --yes
```

## 📥 Installing Packages

### For Package Consumers

**Step 1: Configure npm for GitHub Packages**

Add to your project's `.npmrc` file:
```
@neatsuite:registry=https://npm.pkg.github.com
```

**Step 2: Authentication (if packages are private)**

For private packages, add your GitHub token:
```bash
# Add to your .npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> .npmrc
```

**Step 3: Install packages**
```bash
npm install @neatsuite/http
npm install @neatsuite/http-umd
```

### Authentication Token Setup

**Create GitHub Personal Access Token:**

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `read:packages` (for installing)
   - `write:packages` (for publishing)
4. Copy the generated token

## 🔄 Package Versions

Both packages maintain synchronized versions:

- `@neatsuite/http` - Main TypeScript/Node.js package
- `@neatsuite/http-umd` - Browser/UMD bundle

## 🛠️ Development Workflow

### Local Development
```bash
# Install dependencies
npm ci

# Build all packages
npm run build:all-packages

# Test package creation
npm run package:test
```

### Publishing Workflow
```bash
# 1. Update version in both packages
# 2. Build packages
npm run build:all-packages

# 3. Test publishing
npm run publish:github-packages -- --dry-run

# 4. Publish to GitHub Packages
npm run publish:github-packages
```

## 📋 Troubleshooting

### Common Issues

**Authentication Errors:**
```
npm error code EOTP
npm error This operation requires a one-time password
```
- Solution: Use GitHub token instead of npm 2FA

**Registry Errors:**
```
npm error 404 Not Found - GET https://registry.npmjs.org/@neatsuite%2fhttp
```
- Solution: Ensure `.npmrc` is configured for GitHub Packages

**Token Scope Errors:**
```
npm error 403 Forbidden
```
- Solution: Verify token has `write:packages` scope

### Helpful Commands

```bash
# Check current npm configuration
npm config list

# View package details
npm view @neatsuite/http

# Check authentication
npm whoami --registry=https://npm.pkg.github.com
```

## 🔗 Links

- [GitHub Packages Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- [Repository Packages](https://github.com/HeavenlyEntity/neatsuite/packages)
- [Creating Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

## 📝 Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run publish:github-packages` | Publish all packages to GitHub Packages |
| `npm run publish:github-packages -- --dry-run` | Test publish without actually publishing |
| `npm run publish:github-packages -- --yes` | Skip confirmation prompts |
| `npm run build:all-packages` | Build both packages |
| `npm run package:test` | Test package creation | 