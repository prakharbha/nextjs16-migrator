# nextjs16-migrator

> **The safest, most comprehensive way to migrate to Next.js 16**

[![npm version](https://badge.fury.io/js/nextjs16-migrator.svg)](https://badge.fury.io/js/nextjs16-migrator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Choose Our Migration Tool?

While the official `@next/codemod` provides basic transformations, **nextjs16-migrator** offers enterprise-grade features that make your migration safe, reliable, and comprehensive.

### 🛡️ **Safety First**
- **Automatic Backups**: Creates git commits + file backups before ANY changes
- **One-Command Rollback**: `npx nextjs16-migrator rollback` 
- **Pre-Migration Validation**: Checks compatibility before starting
- **Dry-Run Mode**: Preview ALL changes before applying them

### 🚀 **Superior Developer Experience**
- **Interactive CLI**: Step-by-step guided process with clear explanations
- **Progress Indicators**: Real-time progress bars and status updates
- **Smart Suggestions**: Context-aware recommendations for edge cases
- **Comprehensive Reports**: Detailed before/after analysis

### 📊 **Advanced Features**
- **Performance Analysis**: Lighthouse integration, Core Web Vitals tracking
- **CI/CD Integration**: GitHub Actions workflows for automated migrations
- **Batch Processing**: Migrate multiple projects simultaneously
- **Custom Configurations**: Support for complex project structures

## Quick Start

### Installation

```bash
# Install globally
npm install -g nextjs16-migrator

# Or use directly with npx
npx nextjs16-migrator
```

### Basic Usage

```bash
# Interactive mode (recommended for first-time users)
npx nextjs16-migrator

# Analyze your project
npx nextjs16-migrator analyze

# Preview changes (dry-run)
npx nextjs16-migrator migrate --dry-run

# Execute migration
npx nextjs16-migrator migrate

# Rollback if needed
npx nextjs16-migrator rollback
```

## What Gets Migrated?

### 🔄 **Core Transformations**
- **middleware.ts → proxy.ts**: Automatic conversion with function renaming
- **Cache API Updates**: `revalidateTag()` with cacheLife profiles
- **Async Parameters**: `params`, `searchParams`, `cookies()`, `headers()`
- **next/image Updates**: Legacy image component replacements
- **Configuration Updates**: next.config.js optimizations

### 📋 **Compatibility Checks**
- Node.js version validation (20.9+ required)
- Dependency compatibility analysis
- AMP usage detection and warnings
- Experimental feature flag updates

### ⚡ **Performance Optimizations**
- Bundle size analysis
- Build time measurements
- Core Web Vitals tracking
- Performance improvement recommendations

## Advanced Features

### 🔍 **Project Analysis**

```bash
# Detailed compatibility analysis
npx @nandann/nextjs16-migrator analyze --detailed

# Include performance metrics
npx @nandann/nextjs16-migrator analyze --performance
```

### 🛠️ **Migration Options**

```bash
# Skip backups (not recommended)
npx @nandann/nextjs16-migrator migrate --no-backup

# Include performance analysis
npx @nandann/nextjs16-migrator migrate --performance

# Batch mode for CI/CD
npx @nandann/nextjs16-migrator migrate --batch --yes
```

### 🔄 **Rollback Options**

```bash
# Interactive rollback selection
npx @nandann/nextjs16-migrator rollback

# Automatic rollback (most recent)
npx @nandann/nextjs16-migrator rollback --yes
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Next.js 16 Migration
on:
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * 0' # Weekly on Sunday at 2 AM

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run migration
        run: npx @nandann/nextjs16-migrator migrate --batch --yes --performance
        
      - name: Upload migration report
        uses: actions/upload-artifact@v4
        with:
          name: migration-report
          path: migration-report.html
```

## Migration Report

After each migration, you'll receive a comprehensive HTML report including:

- **Migration Summary**: Files transformed, success rate, complexity
- **Performance Metrics**: Build time, bundle size, Core Web Vitals
- **Transformation Details**: What changed in each file
- **Recommendations**: Next steps and optimizations
- **Backup Information**: Rollback instructions

## Troubleshooting

### Common Issues

**Q: Migration fails with "Node.js version not supported"**
```bash
# Check your Node.js version
node --version

# Next.js 16 requires Node.js 20.9+
# Update using nvm
nvm install 20
nvm use 20
```

**Q: "No backups found" when trying to rollback**
```bash
# Check if backups exist
ls -la .nextjs16-migrator/backups/

# If no backups, you'll need to restore manually from git
git log --oneline
git reset --hard <commit-hash>
```

**Q: "Project is not compatible" error**
```bash
# Run detailed analysis to see specific issues
npx @nandann/nextjs16-migrator analyze --detailed

# Common fixes:
# 1. Update Node.js to 20.9+
# 2. Remove AMP files
# 3. Update experimental.ppr to cacheComponents
```

### Getting Help

- 📚 **Documentation**: [GitHub Repository](https://github.com/prakharbha/nextjs16-migrator)
- 🎥 **Video Tutorials**: Check the `docs/videos/` directory
- 🐛 **Issues**: [GitHub Issues](https://github.com/prakharbha/nextjs16-migrator/issues)
- 💬 **Discord**: [Join our community](https://discord.gg/nandann-creative)

## Comparison with @next/codemod

| Feature | @nandann/nextjs16-migrator | @next/codemod |
|---------|---------------------------|---------------|
| **Safety** | ✅ Automatic backups & rollback | ❌ No backups |
| **UX** | ✅ Interactive CLI with progress | ❌ Basic command line |
| **Preview** | ✅ Dry-run mode | ❌ No preview |
| **Analysis** | ✅ Comprehensive compatibility check | ❌ Basic validation |
| **Performance** | ✅ Built-in performance analysis | ❌ No performance tracking |
| **Documentation** | ✅ Video tutorials + detailed docs | ❌ Basic README |
| **CI/CD** | ✅ GitHub Actions integration | ❌ Manual process |
| **Support** | ✅ Professional support available | ❌ Community only |
| **Reports** | ✅ Detailed HTML reports | ❌ No reporting |

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/nandann-creative/nextjs16-migrator.git
cd nextjs16-migrator

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run in development mode
npm run dev
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Enterprise Support**: Available for teams and organizations
- **Migration Consulting**: Professional migration services
- **Training**: Custom training sessions for your team

Contact us at [prakhar@nandann.com](mailto:prakhar@nandann.com) for enterprise support.

---

**Made with ❤️ by [Nandann Creative](https://nandann.com)**

*The safest way to migrate to Next.js 16*
