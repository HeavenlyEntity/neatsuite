#!/usr/bin/env node

/**
 * Build, package, and publish script for @neatsuite packages to GitHub Packages
 * 
 * This script will:
 * 1. Clean and build both packages
 * 2. Configure packages for GitHub Packages registry
 * 3. Publish both packages to GitHub Packages
 * 4. Provide detailed status and error reporting
 * 
 * Features:
 * - GitHub Packages registry configuration
 * - Supports GitHub Personal Access Token authentication
 * - Automatic .npmrc configuration
 * - Dry-run mode for testing
 * - Comprehensive error handling and retry logic
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const PACKAGES = [
  {
    name: '@neatsuite/http',
    directory: 'packages/netsuite',
    workspace: '@neatsuite/http'
  },
  {
    name: '@neatsuite/http-umd', 
    directory: 'packages/netsuite-umd',
    workspace: '@neatsuite/http-umd'
  }
];

const GITHUB_REGISTRY = 'https://npm.pkg.github.com';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf-8',
      ...options
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout ? error.stdout.trim() : '',
      stderr: error.stderr ? error.stderr.trim() : ''
    };
  }
}

function checkGitHubToken() {
  // Check for GitHub token in environment or .npmrc
  if (process.env.GITHUB_TOKEN) {
    return {
      hasToken: true,
      source: 'GITHUB_TOKEN environment variable',
      token: process.env.GITHUB_TOKEN
    };
  }

  if (process.env.NODE_AUTH_TOKEN) {
    return {
      hasToken: true,
      source: 'NODE_AUTH_TOKEN environment variable', 
      token: process.env.NODE_AUTH_TOKEN
    };
  }

  // Check .npmrc files for GitHub token
  const npmrcPaths = [
    path.join(process.cwd(), '.npmrc'),
    path.join(os.homedir(), '.npmrc')
  ];

  for (const npmrcPath of npmrcPaths) {
    if (fs.existsSync(npmrcPath)) {
      try {
        const content = fs.readFileSync(npmrcPath, 'utf8');
        const githubTokenMatch = content.match(/^\/\/npm\.pkg\.github\.com\/:\s*_authToken\s*=\s*(.+)$/m);
        if (githubTokenMatch && githubTokenMatch[1].trim()) {
          return {
            hasToken: true,
            source: npmrcPath,
            token: githubTokenMatch[1].trim()
          };
        }
      } catch (error) {
        continue;
      }
    }
  }

  return { hasToken: false };
}

function configureForGitHubPackages() {
  logStep('CONFIG', 'Configuring packages for GitHub Packages...');

  // Update package.json files to ensure correct publishConfig
  PACKAGES.forEach(pkg => {
    const packageJsonPath = path.join(pkg.directory, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Update publishConfig for GitHub Packages
      packageJson.publishConfig = {
        ...packageJson.publishConfig,
        registry: GITHUB_REGISTRY,
        access: 'public'
      };

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      logSuccess(`Configured ${pkg.name} for GitHub Packages`);
    }
  });

  // Configure .npmrc for GitHub Packages
  const npmrcPath = path.join(process.cwd(), '.npmrc');
  let npmrcContent = '';
  
  if (fs.existsSync(npmrcPath)) {
    npmrcContent = fs.readFileSync(npmrcPath, 'utf8');
  }

  // Add GitHub Packages registry configuration if not present
  if (!npmrcContent.includes('@neatsuite:registry=')) {
    npmrcContent += `\n@neatsuite:registry=${GITHUB_REGISTRY}\n`;
  }

  const tokenCheck = checkGitHubToken();
  if (tokenCheck.hasToken && !npmrcContent.includes('//npm.pkg.github.com/:_authToken=')) {
    npmrcContent += `//npm.pkg.github.com/:_authToken=${tokenCheck.token}\n`;
  }

  fs.writeFileSync(npmrcPath, npmrcContent);
  logSuccess('Configured .npmrc for GitHub Packages');
}

function restorePackageConfigs() {
  logStep('RESTORE', 'Restoring original package configurations...');
  
  PACKAGES.forEach(pkg => {
    const packageJsonPath = path.join(pkg.directory, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Restore original publishConfig
      if (packageJson.publishConfig && packageJson.publishConfig.registry === GITHUB_REGISTRY) {
        packageJson.publishConfig = {
          access: 'public'
        };
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      }
    }
  });
  
  logSuccess('Restored package configurations');
}

function buildPackage(packageInfo) {
  logStep('BUILD', `Building ${packageInfo.name}...`);
  
  const result = runCommand(`npm run build --workspace=${packageInfo.workspace}`, {
    cwd: process.cwd()
  });
  
  if (!result.success) {
    logError(`Failed to build ${packageInfo.name}`);
    console.log('Error:', result.error);
    if (result.stderr) console.log('Stderr:', result.stderr);
    return false;
  }
  
  logSuccess(`Built ${packageInfo.name}`);
  return true;
}

function publishPackage(packageInfo, isDryRun = false) {
  const action = isDryRun ? 'DRY-RUN' : 'PUBLISH';
  logStep(action, `Publishing ${packageInfo.name} to GitHub Packages...`);
  
  const command = isDryRun 
    ? `npm publish --dry-run --workspace=${packageInfo.workspace}`
    : `npm publish --workspace=${packageInfo.workspace}`;
  
  const result = runCommand(command, {
    cwd: process.cwd()
  });
  
  if (!result.success) {
    logError(`Failed to publish ${packageInfo.name}`);
    console.log('Error:', result.error);
    if (result.stderr) console.log('Stderr:', result.stderr);
    return false;
  }
  
  if (isDryRun) {
    logSuccess(`Dry-run successful for ${packageInfo.name}`);
  } else {
    logSuccess(`Published ${packageInfo.name} to GitHub Packages`);
  }
  return true;
}

async function promptUser(question) {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question(question, (answer) => {
      readline.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const skipPrompt = args.includes('--yes') || args.includes('-y');
  
  // Check for help
  if (args.includes('--help') || args.includes('-h')) {
    log('\n🚀 NetSuite HTTP Packages - GitHub Packages Publisher', 'bright');
    log('================================================', 'cyan');
    log('\nUsage: node scripts/publish-github-packages.js [options]', 'cyan');
    log('\nOptions:', 'yellow');
    log('  --dry-run       Test the publish process without actually publishing', 'blue');
    log('  --yes, -y       Skip confirmation prompts', 'blue');
    log('  --help, -h      Show this help message', 'blue');
    log('\nEnvironment Variables:', 'yellow');
    log('  GITHUB_TOKEN    GitHub Personal Access Token for authentication', 'blue');
    log('  NODE_AUTH_TOKEN Alternative environment variable for token', 'blue');
    log('\nNote: Requires a GitHub Personal Access Token with "write:packages" scope.', 'yellow');
    log('You can set this in GITHUB_TOKEN environment variable or .npmrc file.', 'yellow');
    process.exit(0);
  }
  
  log('\n🚀 NetSuite HTTP Packages - GitHub Packages Publisher', 'bright');
  log('=================================================', 'cyan');
  
  if (isDryRun) {
    log('\n🧪 DRY RUN MODE - No packages will be published', 'yellow');
  }

  // Step 1: Check GitHub token
  logStep('1', 'Checking GitHub authentication...');
  const tokenCheck = checkGitHubToken();
  if (!tokenCheck.hasToken) {
    logError('No GitHub token found!');
    log('\nTo publish to GitHub Packages, you need a GitHub Personal Access Token.', 'yellow');
    log('Please set one of the following:', 'cyan');
    log('  • GITHUB_TOKEN environment variable', 'blue');
    log('  • Add to .npmrc: //npm.pkg.github.com/:_authToken=YOUR_TOKEN', 'blue');
    log('\nToken needs "write:packages" scope for publishing.', 'yellow');
    process.exit(1);
  }
  
  logSuccess(`Found GitHub token in: ${tokenCheck.source}`);

  try {
    // Step 2: Configure for GitHub Packages
    logStep('2', 'Configuring for GitHub Packages...');
    configureForGitHubPackages();

    // Step 3: Build packages
    logStep('3', 'Building packages...');
    for (const pkg of PACKAGES) {
      if (!buildPackage(pkg)) {
        logError(`Build failed for ${pkg.name}`);
        process.exit(1);
      }
    }

    // Step 4: Confirm publication
    if (!skipPrompt && !isDryRun) {
      const answer = await promptUser('\n📦 Ready to publish to GitHub Packages. Continue? (y/N): ');
      if (answer !== 'y' && answer !== 'yes') {
        log('Publication cancelled by user', 'yellow');
        process.exit(0);
      }
    }

    // Step 5: Publish packages
    logStep('4', isDryRun ? 'Testing publication...' : 'Publishing to GitHub Packages...');
    let publishCount = 0;
    
    for (const pkg of PACKAGES) {
      if (publishPackage(pkg, isDryRun)) {
        publishCount++;
      } else {
        logError(`Publication failed for ${pkg.name}`);
        process.exit(1);
      }
    }

    // Final summary
    log('\n🎉 SUCCESS!', 'green');
    log('=============', 'green');
    
    if (isDryRun) {
      log(`✅ Dry-run completed successfully for ${publishCount} packages`, 'green');
      log('Run without --dry-run to actually publish to GitHub Packages', 'cyan');
    } else {
      log(`✅ Successfully published ${publishCount} packages to GitHub Packages!`, 'green');
      PACKAGES.forEach(pkg => {
        const packageJson = JSON.parse(fs.readFileSync(path.join(pkg.directory, 'package.json'), 'utf8'));
        log(`   • ${pkg.name}@${packageJson.version}`, 'blue');
      });
    }

    log('\n📖 Installation Instructions:', 'cyan');
    log('Add to your project\'s .npmrc:', 'yellow');
    log(`   @neatsuite:registry=${GITHUB_REGISTRY}`, 'blue');
    log('Then install:', 'yellow');
    PACKAGES.forEach(pkg => {
      log(`   npm install ${pkg.name}`, 'blue');
    });

  } finally {
    // Always restore original configurations
    restorePackageConfigs();
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  logError('\nUnexpected error:');
  console.error(error);
  restorePackageConfigs();
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logError('\nUnhandled promise rejection:');
  console.error(error);
  restorePackageConfigs();
  process.exit(1);
});

// Run the script
main().catch((error) => {
  logError('\nScript failed:');
  console.error(error);
  restorePackageConfigs();
  process.exit(1);
}); 