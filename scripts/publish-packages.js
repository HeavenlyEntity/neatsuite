#!/usr/bin/env node

/**
 * Build, package, and publish script for @neatsuite/http packages
 * 
 * This script will:
 * 1. Clean and build both packages
 * 2. Run package validation tests  
 * 3. Publish both packages to npm
 * 4. Provide detailed status and error reporting
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function checkPackageExists(packageName) {
  logStep('CHECK', `Checking if ${packageName} directory exists...`);
  
  const packagePath = PACKAGES.find(p => p.name === packageName)?.directory;
  if (!packagePath || !fs.existsSync(packagePath)) {
    logError(`Package directory ${packagePath} not found`);
    return false;
  }
  
  const packageJsonPath = path.join(packagePath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    logError(`package.json not found in ${packagePath}`);
    return false;
  }
  
  logSuccess(`Package ${packageName} found`);
  return true;
}

function getPackageVersion(packageName) {
  const packagePath = PACKAGES.find(p => p.name === packageName)?.directory;
  const packageJsonPath = path.join(packagePath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
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
  
  // Check if dist directory was created
  const distPath = path.join(packageInfo.directory, 'dist');
  if (!fs.existsSync(distPath)) {
    logError(`Dist directory not found after build: ${distPath}`);
    return false;
  }
  
  logSuccess(`Built ${packageInfo.name}`);
  return true;
}

function testPackage(packageInfo) {
  logStep('TEST', `Testing package ${packageInfo.name}...`);
  
  const result = runCommand(`npm pack --dry-run --workspace=${packageInfo.workspace}`, {
    cwd: process.cwd()
  });
  
  if (!result.success) {
    logError(`Package test failed for ${packageInfo.name}`);
    console.log('Error:', result.error);
    return false;
  }
  
  // Extract package size from output
  const sizeMatch = result.output.match(/package size:\s*([\d.]+\s*[A-Za-z]+)/);
  if (sizeMatch) {
    log(`Package size: ${sizeMatch[1]}`, 'blue');
  }
  
  logSuccess(`Package test passed for ${packageInfo.name}`);
  return true;
}

function publishPackage(packageInfo, isDryRun = false) {
  const action = isDryRun ? 'DRY-RUN' : 'PUBLISH';
  logStep(action, `Publishing ${packageInfo.name}...`);
  
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
    logSuccess(`Published ${packageInfo.name}`);
  }
  return true;
}

function checkVersions() {
  logStep('VERSION', 'Checking package versions...');
  
  const versions = PACKAGES.map(pkg => ({
    name: pkg.name,
    version: getPackageVersion(pkg.name)
  }));
  
  // Check if versions match
  const mainVersion = versions[0].version;
  const allMatch = versions.every(v => v.version === mainVersion);
  
  versions.forEach(v => {
    log(`${v.name}: v${v.version}`, allMatch ? 'green' : 'yellow');
  });
  
  if (!allMatch) {
    logWarning('Package versions do not match!');
    return false;
  }
  
  logSuccess(`All packages are at version ${mainVersion}`);
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
  
  log('\n🚀 NetSuite HTTP Packages - Build & Publish Script', 'bright');
  log('================================================', 'cyan');
  
  if (isDryRun) {
    log('\n🧪 DRY RUN MODE - No packages will be published', 'yellow');
  }
  
  // Step 1: Check all packages exist
  logStep('1', 'Validating packages...');
  for (const pkg of PACKAGES) {
    if (!checkPackageExists(pkg.name)) {
      process.exit(1);
    }
  }
  
  // Step 2: Check versions
  logStep('2', 'Checking versions...');
  if (!checkVersions()) {
    const answer = await promptUser('\nContinue anyway? (y/N): ');
    if (answer !== 'y' && answer !== 'yes') {
      log('Aborted by user', 'yellow');
      process.exit(0);
    }
  }
  
  // Step 3: Clean and build all packages
  logStep('3', 'Building packages...');
  for (const pkg of PACKAGES) {
    if (!buildPackage(pkg)) {
      logError(`Build failed for ${pkg.name}`);
      process.exit(1);
    }
  }
  
  // Step 4: Test packages
  logStep('4', 'Testing packages...');
  for (const pkg of PACKAGES) {
    if (!testPackage(pkg)) {
      logError(`Package test failed for ${pkg.name}`);
      process.exit(1);
    }
  }
  
  // Step 5: Confirm publication
  if (!skipPrompt && !isDryRun) {
    const answer = await promptUser('\n📦 Ready to publish both packages. Continue? (y/N): ');
    if (answer !== 'y' && answer !== 'yes') {
      log('Publication cancelled by user', 'yellow');
      process.exit(0);
    }
  }
  
  // Step 6: Publish packages
  logStep('5', isDryRun ? 'Testing publication...' : 'Publishing packages...');
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
    log('Run without --dry-run to actually publish', 'cyan');
  } else {
    log(`✅ Successfully published ${publishCount} packages to npm!`, 'green');
    PACKAGES.forEach(pkg => {
      const version = getPackageVersion(pkg.name);
      log(`   • ${pkg.name}@${version}`, 'blue');
    });
  }
  
  log('\n📖 View packages at:', 'cyan');
  PACKAGES.forEach(pkg => {
    log(`   • https://www.npmjs.com/package/${pkg.name}`, 'blue');
  });
}

// Handle errors
process.on('uncaughtException', (error) => {
  logError('\nUnexpected error:');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logError('\nUnhandled promise rejection:');
  console.error(error);
  process.exit(1);
});

// Run the script
main().catch((error) => {
  logError('\nScript failed:');
  console.error(error);
  process.exit(1);
}); 