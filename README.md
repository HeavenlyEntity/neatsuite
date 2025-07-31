# NeatSuite - NetSuite Development Tools

<img width="1312" height="736" alt="Modern software announcement banner for 'neatsuite' HTTP library, featuring a dark gradient background, bold modern font, code snippets, subtle neon developer accents, and a Ko-Fi coffee cup icon_" src="https://github.com/user-attachments/assets/222acfd1-67cb-4413-ac07-4816ab70a159" />

![NPM Downloads](https://img.shields.io/npm/dm/%40neatsuite%2Fhttp?style=for-the-badge&label=http-%20Downloads)
![NPM Downloads](https://img.shields.io/npm/dm/%40neatsuite%2Fhttp-umd?style=for-the-badge&label=http-umd%20-%20Downloads)
![NPM Version](https://img.shields.io/npm/v/%40neatsuite%2Fhttp?style=for-the-badge&label=%40neatsuite%2Fhttp)
![NPM Version](https://img.shields.io/npm/v/%40neatsuite%2Fhttp-umd?style=for-the-badge&label=%40neatsuite%2Fhttp-umd&color=214eee)




A comprehensive TypeScript-first monorepo of tools, utilities, and React components for NetSuite development. Built with performance, developer experience, and type safety in mind.

## 🚀 What's Inside?

NeatSuite provides a complete toolkit for NetSuite integration and development:

### Core Packages

- **[@neatsuite/http](https://www.npmjs.com/package/@neatsuite/http)** - TypeScript-first NetSuite API client with OAuth 1.0a authentication, automatic retries, and performance monitoring
- **[@neatsuite/http-umd](https://www.npmjs.com/package/@neatsuite/http-umd)** - UMD/browser bundle of the HTTP client for client-side applications
- **[@neatsuite/core](https://www.npmjs.com/package/@neatsuite/core)** - React components and NetSuite-specific UI elements
- **[@neatsuite/utils](https://www.npmjs.com/package/@neatsuite/utils)** - Shared React utilities and hooks

### Developer Tools

- **@neatsuite/tsconfig** - Shared TypeScript configurations for consistent builds
- **@neatsuite/eslint-config** - ESLint presets optimized for NetSuite development

### Documentation & Examples

- **docs** - Next.js-powered documentation site with examples and API references

## 📦 Quick Start

### Installation

Choose the package that fits your needs:

```bash
# For Node.js/server-side NetSuite API integration
npm install @neatsuite/http

# For browser/client-side usage
npm install @neatsuite/http-umd

```

### Basic Usage

```typescript
import { NetSuiteClient } from '@neatsuite/http';

// Initialize the NetSuite client
const client = new NetSuiteClient({
  oauth: {
    consumerKey: process.env.NETSUITE_CONSUMER_KEY!,
    consumerSecret: process.env.NETSUITE_CONSUMER_SECRET!,
    tokenKey: process.env.NETSUITE_TOKEN_KEY!,
    tokenSecret: process.env.NETSUITE_TOKEN_SECRET!,
    realm: process.env.NETSUITE_REALM!
  },
  accountId: process.env.NETSUITE_ACCOUNT_ID!
});

// Make a RESTlet call
const response = await client.restlet({
  script: '123',
  deploy: '1',
  params: { action: 'getCustomer', id: '456' }
});
```

## 🏗️ Development Setup

### Prerequisites

- **Node.js**: Version 20 or higher
- **Package Manager**: npm (v10.9.2 recommended)
- **Git**: For version control and contributions

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/neatsuite/netsuite-http.git
cd neatsuite

# Install dependencies
npm install

# Build all packages
npm run build
```

### Available Scripts

- **`npm run build`** - Build all packages and documentation
- **`npm run dev`** - Start development mode with hot reloading
- **`npm run lint`** - Lint all packages using ESLint
- **`npm run test`** - Run tests across all packages
- **`npm run clean`** - Clean up all `node_modules` and `dist` folders
- **`npm run format`** - Format code using Prettier

### Package-Specific Scripts

```bash
# Build specific packages
npm run build:netsuite          # Build @neatsuite/http
npm run build:netsuite-umd      # Build @neatsuite/http-umd
npm run build:all-packages      # Build both HTTP packages

# Publishing (for maintainers)
npm run publish:all-packages    # Publish all packages
npm run changeset              # Generate a changeset
npm run version-packages       # Version packages using changesets
```

## 🔧 Architecture

This project uses:

- **[Turborepo](https://turborepo.com/)** - High-performance build system for monorepos
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety across all packages
- **[Changesets](https://github.com/changesets/changesets)** - Version management and publishing
- **[tsup](https://tsup.egoist.dev/)** - Fast TypeScript bundler
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io)** - Code quality and formatting

### Monorepo Structure

```
neatsuite/
├── packages/
│   ├── netsuite/           # @neatsuite/http - Main API client
│   ├── netsuite-umd/       # @neatsuite/http-umd - Browser bundle
│   ├── neatsuite-core/     # @neatsuite/core - React components
│   ├── neatsuite-utils/    # @neatsuite/utils - Shared utilities
│   ├── neatsuite-tsconfig/ # @neatsuite/tsconfig - TS configs
│   └── eslint-config/      # @neatsuite/eslint-config - ESLint presets
├── apps/
│   └── docs/              # Documentation site
└── scripts/               # Build and publish automation
```

## 🤝 Contributing

We welcome contributions from the community! Please read our contribution guidelines below.

### Ways to Contribute

- 🐛 **Report Bugs**: Open an issue with detailed reproduction steps
- 💡 **Feature Requests**: Suggest new features or improvements
- 📖 **Documentation**: Improve docs, examples, or code comments
- 🔧 **Code Contributions**: Fix bugs or implement new features

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/neatsuite.git
   cd neatsuite
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Make your changes** and ensure they work:
   ```bash
   npm run build
   npm run test
   npm run lint
   ```

### Contribution Guidelines

- **Code Style**: Follow existing code patterns and run `npm run format` before committing
- **Testing**: Add tests for new features and ensure existing tests pass
- **Documentation**: Update relevant documentation for any changes
- **Commit Messages**: Use clear, descriptive commit messages
- **Pull Requests**: Include a detailed description of changes and link any related issues

### Development Workflow

1. **Make Changes**: Work on your feature or bugfix
2. **Test Locally**: 
   ```bash
   npm run build    # Ensure builds work
   npm run test     # Run tests
   npm run lint     # Check code quality
   ```
3. **Create Changeset** (for package changes):
   ```bash
   npm run changeset
   ```
4. **Commit and Push**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```
5. **Open Pull Request**: Create a PR with detailed description

### Issue Reporting

When reporting issues, please include:

- **Clear Description**: What happened vs. what you expected
- **Reproduction Steps**: Minimal code example to reproduce the issue
- **Environment**: Node.js version, package versions, OS
- **Error Messages**: Full error logs if applicable

## 📋 Project Roadmap

### Current Focus
- Enhanced TypeScript support across all packages
- Performance optimizations for high-volume API usage
- Additional React components for common NetSuite patterns
- Improved error handling and debugging tools

### Future Plans
- GraphQL support for NetSuite SuiteTalk
- Visual form builders for NetSuite records
- Real-time data synchronization utilities
- Enhanced testing and mocking tools

## 🐛 Support & Issues

- **Bug Reports**: [GitHub Issues](https://github.com/neatsuite/netsuite-http/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/neatsuite/netsuite-http/discussions)
- **Documentation**: [API Documentation](https://neatsuite.github.io/netsuite-http)

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- NetSuite for providing the APIs that make this project possible
- The TypeScript and React communities for excellent tooling
- All contributors who help improve NeatSuite

---

**Ready to get started?** Check out the [documentation](https://neatsuite.github.io/netsuite-http) or explore the [examples](packages/netsuite/examples/) to see NeatSuite in action!
