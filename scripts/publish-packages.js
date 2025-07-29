#!/usr/bin/env node

/**
 * Build, package, and publish script for @neatsuite/http packages
 * 
 * This script will:
 * 1. Clean and build both packages
 * 2. Run package validation tests  
 * 3. Publish both packages to npm with 2FA support
 * 4. Provide detailed status and error reporting
 * 
 * Features:
 * - Smart auth token detection from .npmrc files
 * - Supports npm accounts with 2FA enabled
 * - Interactive OTP prompts or command-line OTP input
 * - Automatic fallback to OTP if auth token requires 2FA
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

function publishPackage(packageInfo, isDryRun = false, otp = null) {
  const action = isDryRun ? 'DRY-RUN' : 'PUBLISH';
  logStep(action, `Publishing ${packageInfo.name}...`);
  
  let command = isDryRun 
    ? `npm publish --dry-run --workspace=${packageInfo.workspace}`
    : `npm publish --workspace=${packageInfo.workspace}`;
  
  // Add OTP if provided
  if (otp && !isDryRun) {
    command += ` --otp=${otp}`;
  }
  
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

function checkAuthToken() {
  // Check for auth tokens in various .npmrc locations
  const npmrcPaths = [
    path.join(process.cwd(), '.npmrc'),           // Project .npmrc
    path.join(os.homedir(), '.npmrc'),            // User .npmrc
    path.join(process.env.PREFIX || '/usr/local', 'etc', 'npmrc') // Global .npmrc
  ];
  
  for (const npmrcPath of npmrcPaths) {
    if (fs.existsSync(npmrcPath)) {
      try {
        const content = fs.readFileSync(npmrcPath, 'utf8');
        // Look for auth tokens for npm registry
        const authTokenMatch = content.match(/^\/\/registry\.npmjs\.org\/:_authToken=(.+)$/m);
        if (authTokenMatch && authTokenMatch[1].trim()) {
          return {
            hasToken: true,
            tokenFile: npmrcPath,
            token: authTokenMatch[1].trim()
          };
        }
      } catch (error) {
        // Continue to next file if this one can't be read
        continue;
      }
    }
  }
  
  return { hasToken: false };
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
  
  // Check for OTP argument
  const otpIndex = args.findIndex(arg => arg.startsWith('--otp='));
  const otpFromArgs = otpIndex !== -1 ? args[otpIndex].split('=')[1] : null;
  
  // Check for help
  if (args.includes('--help') || args.includes('-h')) {
    log('\n🚀 NetSuite HTTP Packages - Build & Publish Script', 'bright');
    log('================================================', 'cyan');
    log('\nUsage: node scripts/publish-packages.js [options]', 'cyan');
    log('\nOptions:', 'yellow');
    log('  --dry-run       Test the publish process without actually publishing', 'blue');
    log('  --yes, -y       Skip confirmation prompts', 'blue');
    log('  --otp=<code>    Provide 2FA OTP code directly (6 digits)', 'blue');
    log('  --help, -h      Show this help message', 'blue');
    log('\nNote: The script will check for auth tokens in .npmrc files.', 'yellow');
    log('If no auth token is found or 2FA is required, you will be prompted for an OTP code.', 'yellow');
    process.exit(0);
  }
  
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
  
  // Step 6: Check for auth token and get OTP if needed
  const authCheck = checkAuthToken();
  let otp = null;
  
  if (!isDryRun) {
    if (authCheck.hasToken) {
      log(`🔑 Found auth token in ${authCheck.tokenFile}`, 'green');
      log('Skipping OTP prompt (will retry with OTP if publish fails)', 'cyan');
    } else {
      log('No auth token found in .npmrc files', 'yellow');
      if (otpFromArgs) {
        if (!/^\d{6}$/.test(otpFromArgs)) {
          logError('Invalid OTP format in --otp argument. Please provide a 6-digit code.');
          process.exit(1);
        }
        otp = otpFromArgs;
        log(`🔐 Using OTP from command line: ${otp}`, 'cyan');
      } else {
        otp = await promptUser('\n🔐 Enter your 2FA OTP code (6 digits): ');
        if (!otp || !/^\d{6}$/.test(otp)) {
          logError('Invalid OTP format. Please enter a 6-digit code.');
          process.exit(1);
        }
      }
    }
  }

  // Step 7: Publish packages
  logStep('5', isDryRun ? 'Testing publication...' : 'Publishing packages...');
  let publishCount = 0;
  
  for (const pkg of PACKAGES) {
    if (publishPackage(pkg, isDryRun, otp)) {
      publishCount++;
    } else {
      logError(`Publication failed for ${pkg.name}`);
      // If first package fails, it might be due to 2FA requirements
      if (!isDryRun && pkg === PACKAGES[0] && publishCount === 0) {
        if (authCheck.hasToken && !otp) {
          log('\nAuth token found but publish failed. This might require 2FA.', 'yellow');
          const retryOtp = await promptUser('Enter your 2FA OTP code (6 digits): ');
          if (retryOtp && /^\d{6}$/.test(retryOtp)) {
            log('Retrying with OTP...', 'cyan');
            if (publishPackage(pkg, isDryRun, retryOtp)) {
              otp = retryOtp; // Use the OTP for remaining packages
              publishCount++;
              continue;
            }
          }
        } else if (otp) {
          log('\nThis might be due to an invalid or expired OTP code.', 'yellow');
          const retryOtp = await promptUser('Enter a new OTP code: ');
          if (retryOtp && /^\d{6}$/.test(retryOtp)) {
            log('Retrying with new OTP...', 'cyan');
            if (publishPackage(pkg, isDryRun, retryOtp)) {
              otp = retryOtp; // Use the new OTP for remaining packages
              publishCount++;
              continue;
            }
          }
        }
      }
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