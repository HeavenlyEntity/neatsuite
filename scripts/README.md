# Build & Publish Scripts

This directory contains scripts for building and publishing the NetSuite HTTP packages.

## Available Scripts

### 🚀 `publish-packages.js`

The main script for building, testing, and publishing both packages.

**Features:**
- ✅ Validates package structure
- ✅ Checks version consistency 
- ✅ Builds both packages
- ✅ Runs package validation tests
- ✅ Interactive confirmation prompts
- ✅ Colorized output and progress tracking
- ✅ Comprehensive error handling
- ✅ Dry-run mode for testing

**Usage:**

```bash
# Run with interactive prompts
npm run publish:all-packages

# Skip prompts (auto-confirm)
npm run publish:all-packages -- --yes

# Dry run (test without publishing)
npm run publish:all-packages -- --dry-run

# Dry run without prompts
npm run publish:all-packages -- --dry-run --yes
```

**Direct execution:**
```bash
node scripts/publish-packages.js [options]
```

**Options:**
- `--dry-run` - Test the build and publish process without actually publishing
- `--yes`, `-y` - Skip all confirmation prompts
- `--help` - Show help information

## Package.json Scripts

The following scripts are available from the root of the monorepo:

### Build Scripts
```bash
npm run build:netsuite          # Build main package only
npm run build:netsuite-umd      # Build UMD package only  
npm run build:all-packages      # Build both packages
```

### Test Scripts
```bash
npm run pack:netsuite           # Test main package structure
npm run pack:netsuite-umd       # Test UMD package structure
npm run package:test            # Test both packages
```

### Publish Scripts
```bash
npm run publish:netsuite        # Publish main package only
npm run publish:netsuite-umd    # Publish UMD package only
npm run publish:all-packages    # Comprehensive build + publish both
```

## Workflow Examples

### 1. Full Release Process
```bash
# 1. Update versions in both package.json files to match
# 2. Run comprehensive build and publish
npm run publish:all-packages

# Or with auto-confirm
npm run publish:all-packages -- --yes
```

### 2. Test Before Publishing
```bash
# Test the entire process without publishing
npm run publish:all-packages -- --dry-run

# If successful, run the real publish
npm run publish:all-packages -- --yes
```

### 3. Individual Package Management
```bash
# Build and test individual packages
npm run build:netsuite
npm run pack:netsuite

npm run build:netsuite-umd  
npm run pack:netsuite-umd

# Publish individually if needed
npm run publish:netsuite
npm run publish:netsuite-umd
```

### 4. Troubleshooting Builds
```bash
# Clean and rebuild everything
npm run clean
npm run build:all-packages

# Test package structure
npm run package:test
```

## Script Output

The publish script provides detailed output including:

- 📦 Package validation status
- 🔍 Version consistency checks  
- 🏗️ Build progress and results
- 📊 Package size information
- ✅ Publish confirmation and links
- ❌ Detailed error reporting

## Requirements

- Node.js >= 20
- npm with workspace support
- Proper npm authentication for publishing to @neatsuite scope

## Error Handling

The scripts include comprehensive error handling:

- **Build failures**: Stops execution and shows detailed error messages
- **Package validation**: Checks for required files and structure
- **Version mismatches**: Warns but allows override with confirmation
- **Publish failures**: Shows detailed npm error messages and stops execution

## Security Notes

- The scripts validate package structure before publishing
- Interactive prompts prevent accidental publishes
- Dry-run mode allows safe testing
- All external commands are properly escaped

For issues with the scripts, check the package structure and ensure all dependencies are installed with `npm install` from the root directory. 