#!/usr/bin/env node
/**
 * Universal Native Dependency Manager
 * Production-ready cross-platform native binary management system
 * Handles all native dependencies with intelligent fallbacks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Universal Native Dependency Configuration
 * Add any package that has native binaries or platform-specific dependencies here
 */
const NATIVE_DEPENDENCIES = {
  // CSS/Styling
  'lightningcss': {
    binaryName: 'lightningcss',
    wasmPackage: 'lightningcss-wasm',
    wasmEnvVar: 'CSS_TRANSFORMER_WASM',
    platforms: ['darwin-arm64', 'darwin-x64', 'linux-x64-gnu', 'linux-x64-musl', 'linux-arm64-gnu', 'win32-x64-msvc'],
    critical: true // Build will fail without this
  },
  '@tailwindcss/oxide': {
    binaryName: 'tailwindcss-oxide',
    wasmPackage: null,
    platforms: ['darwin-arm64', 'darwin-x64', 'linux-x64-gnu', 'linux-x64-musl', 'linux-arm64-gnu', 'win32-x64-msvc'],
    critical: true
  },
  // Image Processing
  'sharp': {
    binaryName: 'sharp',
    wasmPackage: null,
    platforms: ['darwin-arm64', 'darwin-x64', 'linux-x64-gnu', 'linux-x64-musl', 'linux-arm64-gnu', 'win32-x64-msvc'],
    packagePattern: '@img/sharp-{platform}',
    critical: false // Optional, can gracefully degrade
  },
  // SWC (Next.js compiler)
  '@next/swc': {
    binaryName: 'index',
    wasmPackage: null, // Next.js handles SWC fallbacks internally
    platforms: ['darwin-arm64', 'darwin-x64', 'linux-x64-gnu', 'linux-x64-musl', 'linux-arm64-gnu', 'win32-x64-msvc'],
    packagePattern: '@next/swc-{platform}',
    critical: false // Next.js can fall back to Babel
  },
  // esbuild
  'esbuild': {
    binaryName: 'bin/esbuild',
    wasmPackage: 'esbuild-wasm',
    wasmEnvVar: 'ESBUILD_WASM',
    platforms: ['darwin-arm64', 'darwin-x64', 'linux-x64', 'linux-arm64', 'win32-x64'],
    packagePattern: '@esbuild/{platform}',
    critical: false
  },
  // Prisma (if used)
  '@prisma/engines': {
    binaryName: 'query-engine',
    wasmPackage: null,
    platforms: ['darwin-arm64', 'darwin', 'linux-x64-openssl-1.1.x', 'linux-x64-openssl-3.0.x', 'windows'],
    critical: false
  },
  // Playwright browsers
  'playwright': {
    customSetup: 'setupPlaywright',
    critical: false
  }
};

/**
 * System Information and Platform Detection
 */
class SystemInfo {
  constructor() {
    this.platform = process.platform;
    this.arch = process.arch;
    this.libc = this.platform === 'linux' ? this.detectLinuxLibc() : null;
    this.platformSuffix = this.getPlatformSuffix();
  }

  detectLinuxLibc() {
    try {
      const output = execSync('ldd --version 2>&1', { encoding: 'utf8' });
      return output.toLowerCase().includes('musl') ? 'musl' : 'gnu';
    } catch {
      // Fallback: check for musl-specific files
      const muslFiles = [
        '/lib/libc.musl-x86_64.so.1',
        '/lib/ld-musl-x86_64.so.1',
        '/lib/libc.musl-aarch64.so.1'
      ];
      
      for (const file of muslFiles) {
        if (fs.existsSync(file)) return 'musl';
      }
      
      return 'gnu'; // Default to GNU libc
    }
  }

  getPlatformSuffix() {
    let parts = [this.platform, this.arch];
    
    if (this.platform === 'linux') {
      if (this.arch === 'arm') {
        parts.push('gnueabihf');
      } else {
        parts.push(this.libc);
      }
    } else if (this.platform === 'win32') {
      parts.push('msvc');
    }
    
    return parts.join('-');
  }
}

/**
 * Universal Native Dependency Manager
 */
class NativeDependencyManager {
  constructor() {
    this.system = new SystemInfo();
    this.nodeModules = path.join(__dirname, '..', 'node_modules');
    this.results = {};
    this.envVarsToSet = new Set();
  }

  log(level, message, ...args) {
    const icons = { info: '🔧', success: '✅', warning: '⚠️', error: '❌' };
    console.log(`${icons[level] || '•'} ${message}`, ...args);
  }

  packageExists(packageName) {
    return fs.existsSync(path.join(this.nodeModules, packageName));
  }

  getPackagePattern(config, packageName) {
    if (config.packagePattern) {
      return config.packagePattern.replace('{platform}', this.system.platformSuffix);
    }
    return `${packageName}-${this.system.platformSuffix}`;
  }

  setupWasmFallback(packageName, config) {
    if (!config.wasmPackage) return false;
    
    const wasmPackageDir = path.join(this.nodeModules, config.wasmPackage);
    const mainPackageDir = path.join(this.nodeModules, packageName);
    const pkgDir = path.join(mainPackageDir, 'pkg');
    
    if (!fs.existsSync(wasmPackageDir)) {
      this.log('warning', `WASM fallback package not available: ${config.wasmPackage}`);
      return false;
    }
    
    try {
      // Create pkg directory if needed
      if (!fs.existsSync(pkgDir)) {
        fs.mkdirSync(pkgDir, { recursive: true });
      }
      
      // Copy WASM files
      const wasmFiles = fs.readdirSync(wasmPackageDir)
        .filter(file => file.endsWith('.wasm') || file.endsWith('.js') || file === 'package.json');
      
      for (const file of wasmFiles) {
        const srcPath = path.join(wasmPackageDir, file);
        const destPath = path.join(pkgDir, file);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
      
      if (config.wasmEnvVar) {
        this.envVarsToSet.add(config.wasmEnvVar);
      }
      
      this.log('success', `WASM fallback configured for ${packageName}`);
      return true;
    } catch (error) {
      this.log('error', `Failed to setup WASM fallback for ${packageName}:`, error.message);
      return false;
    }
  }

  setupPlaywright() {
    if (!this.packageExists('playwright')) {
      this.log('info', 'playwright not installed, skipping browser setup');
      return false;
    }
    
    try {
      // Check if browsers are already installed
      const playwrightCache = path.join(require('os').homedir(), '.cache', 'ms-playwright');
      if (fs.existsSync(playwrightCache) && fs.readdirSync(playwrightCache).length > 0) {
        this.log('success', 'Playwright browsers already installed');
        return true;
      }
      
      this.log('info', 'Installing Playwright browsers...');
      execSync('npx playwright install --with-deps chromium', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        timeout: 300000 // 5 minute timeout
      });
      this.log('success', 'Playwright browsers installed');
      return true;
    } catch (error) {
      this.log('error', `Failed to setup Playwright: ${error.message}`);
      return false;
    }
  }

  setupCustomDependency(packageName, config) {
    switch (config.customSetup) {
      case 'setupPlaywright':
        return this.setupPlaywright();
      default:
        this.log('warning', `Unknown custom setup: ${config.customSetup}`);
        return false;
    }
  }

  fixNativeBinary(packageName, config) {
    if (!this.packageExists(packageName)) {
      this.log('info', `${packageName} not installed, skipping`);
      return false;
    }

    // Handle custom setup
    if (config.customSetup) {
      return this.setupCustomDependency(packageName, config);
    }

    if (!config.binaryName) {
      this.log('warning', `No binary name specified for ${packageName}`);
      return false;
    }

    const packageDir = path.join(this.nodeModules, packageName);
    const expectedBinary = `${config.binaryName}.${this.system.platformSuffix}.node`;
    const binaryPath = path.join(packageDir, expectedBinary);

    // Check if binary already exists
    if (fs.existsSync(binaryPath)) {
      this.log('success', `${packageName} binary already exists: ${path.basename(expectedBinary)}`);
      return true;
    }

    // Find platform-specific package
    const platformPackage = this.getPackagePattern(config, packageName);
    const platformBinaryDir = path.join(this.nodeModules, platformPackage);

    if (!fs.existsSync(platformBinaryDir)) {
      this.log('warning', `Platform package not found: ${platformPackage}`);
      
      // Try WASM fallback for critical dependencies
      if (config.critical && config.wasmPackage) {
        this.log('info', `Attempting WASM fallback for critical dependency: ${packageName}`);
        return this.setupWasmFallback(packageName, config);
      }
      
      return false;
    }

    // Search for binary files
    const possibleBinaryPaths = [
      path.join(platformBinaryDir, expectedBinary),
      path.join(platformBinaryDir, `${config.binaryName}.node`),
      path.join(platformBinaryDir, config.binaryName),
      path.join(platformBinaryDir, 'index.node')
    ];

    const foundBinaryPath = possibleBinaryPaths.find(p => fs.existsSync(p));
    
    if (!foundBinaryPath) {
      this.log('warning', `No binary found in ${platformPackage}`);
      
      // Try WASM fallback for critical dependencies
      if (config.critical && config.wasmPackage) {
        return this.setupWasmFallback(packageName, config);
      }
      
      return false;
    }

    // Create symlink or copy binary
    try {
      const relativePath = path.relative(packageDir, foundBinaryPath);
      fs.symlinkSync(relativePath, binaryPath);
      this.log('success', `Created ${packageName} symlink: ${path.basename(binaryPath)} -> ${path.basename(relativePath)}`);
      return true;
    } catch (symlinkError) {
      try {
        fs.copyFileSync(foundBinaryPath, binaryPath);
        this.log('success', `Copied ${packageName} binary: ${path.basename(binaryPath)}`);
        return true;
      } catch (copyError) {
        this.log('error', `Failed to link ${packageName} binary: ${copyError.message}`);
        
        // Last resort: WASM fallback for critical dependencies
        if (config.critical && config.wasmPackage) {
          return this.setupWasmFallback(packageName, config);
        }
        
        return false;
      }
    }
  }

  async fixAllDependencies() {
    this.log('info', `Fixing native dependencies for ${this.system.platform}-${this.system.arch}...`);
    
    const installedDeps = Object.keys(NATIVE_DEPENDENCIES)
      .filter(pkg => this.packageExists(pkg));
    
    if (installedDeps.length === 0) {
      this.log('info', 'No native dependencies found to fix');
      return { success: true, results: {} };
    }

    this.log('info', `Found ${installedDeps.length} native dependencies: ${installedDeps.join(', ')}`);

    // Process all dependencies
    for (const [packageName, config] of Object.entries(NATIVE_DEPENDENCIES)) {
      if (!this.packageExists(packageName)) continue;
      
      this.results[packageName] = this.fixNativeBinary(packageName, config);
    }

    // Set environment variables for WASM fallbacks
    for (const envVar of this.envVarsToSet) {
      process.env[envVar] = '1';
      this.log('info', `Set environment variable: ${envVar}=1`);
    }

    // Report results
    const successCount = Object.values(this.results).filter(Boolean).length;
    const totalCount = Object.keys(this.results).length;
    const criticalFailures = Object.entries(this.results)
      .filter(([pkg, success]) => !success && NATIVE_DEPENDENCIES[pkg].critical)
      .map(([pkg]) => pkg);

    if (criticalFailures.length > 0) {
      this.log('error', `Critical dependencies failed: ${criticalFailures.join(', ')}`);
      this.log('error', 'Build may fail. Consider running: npm install --force');
      return { success: false, results: this.results, criticalFailures };
    }

    this.log('success', `Native dependencies ready: ${successCount}/${totalCount} successful`);
    
    if (successCount < totalCount) {
      const nonCriticalFailures = Object.entries(this.results)
        .filter(([pkg, success]) => !success && !NATIVE_DEPENDENCIES[pkg].critical)
        .map(([pkg]) => pkg);
      
      this.log('warning', `Non-critical dependencies skipped: ${nonCriticalFailures.join(', ')}`);
    }

    return { success: true, results: this.results };
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const manager = new NativeDependencyManager();
    const result = await manager.fixAllDependencies();
    
    if (!result.success) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error in native dependency manager:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Export for testing and module usage
module.exports = {
  NativeDependencyManager,
  SystemInfo,
  NATIVE_DEPENDENCIES
};

// Run if called directly
if (require.main === module) {
  main();
}

