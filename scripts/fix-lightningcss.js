#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Detect libc variant on Linux systems
 */
function detectLinuxLibc() {
  try {
    const output = execSync('ldd --version 2>&1', { encoding: 'utf8' });
    if (output.toLowerCase().includes('musl')) {
      return 'musl';
    }
    return 'gnu';
  } catch {
    // Fallback: check for musl-specific files
    try {
      if (fs.existsSync('/lib/libc.musl-x86_64.so.1') || 
          fs.existsSync('/lib/ld-musl-x86_64.so.1')) {
        return 'musl';
      }
    } catch {}
    
    // Default to gnu if detection fails
    return 'gnu';
  }
}

/**
 * Get platform-specific binary suffix
 */
function getPlatformSuffix(platform, arch) {
  let parts = [platform, arch];
  
  if (platform === 'linux') {
    const libc = detectLinuxLibc();
    if (arch === 'arm') {
      parts.push('gnueabihf');
    } else {
      parts.push(libc);
    }
  } else if (platform === 'win32') {
    parts.push('msvc');
  }
  
  return parts.join('-');
}

/**
 * Fix native binary linking for a specific package
 */
function fixNativeBinary(packageName, binaryName) {
  const platform = process.platform;
  const arch = process.arch;
  const platformSuffix = getPlatformSuffix(platform, arch);
  
  const packageDir = path.join(__dirname, '..', 'node_modules', packageName);
  const expectedBinary = `${binaryName}.${platformSuffix}.node`;
  const binaryPath = path.join(packageDir, expectedBinary);
  
  // Check if package directory exists
  if (!fs.existsSync(packageDir)) {
    console.log(`${packageName} not installed, skipping binary fix`);
    return false;
  }
  
  // Check if binary already exists and is valid
  if (fs.existsSync(binaryPath)) {
    console.log(`✓ ${packageName} binary already exists: ${expectedBinary}`);
    return true;
  }
  
  // Try to find platform-specific package
  const platformPackage = `${packageName}-${platformSuffix}`;
  const platformBinaryDir = path.join(__dirname, '..', 'node_modules', platformPackage);
  const platformBinaryPath = path.join(platformBinaryDir, expectedBinary);
  
  if (!fs.existsSync(platformBinaryPath)) {
    console.log(`⚠️  Platform binary not found: ${platformPackage}`);
    console.log(`   This might cause build issues on ${platform}-${arch}`);
    
    // Try alternative naming patterns
    const altBinaryPath = path.join(platformBinaryDir, `${binaryName}.node`);
    if (fs.existsSync(altBinaryPath)) {
      try {
        const relativePath = path.relative(packageDir, altBinaryPath);
        fs.symlinkSync(relativePath, binaryPath);
        console.log(`✓ Created ${packageName} binary symlink (alt): ${expectedBinary} -> ${relativePath}`);
        return true;
      } catch (error) {
        try {
          fs.copyFileSync(altBinaryPath, binaryPath);
          console.log(`✓ Copied ${packageName} binary (alt): ${expectedBinary}`);
          return true;
        } catch (copyError) {
          console.error(`❌ Failed to link ${packageName} binary:`, copyError.message);
        }
      }
    }
    return false;
  }
  
  try {
    // Create symbolic link to the platform-specific binary
    const relativePath = path.relative(packageDir, platformBinaryPath);
    fs.symlinkSync(relativePath, binaryPath);
    console.log(`✓ Created ${packageName} binary symlink: ${expectedBinary} -> ${relativePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create ${packageName} binary symlink:`, error.message);
    
    // Fallback: try to copy the file instead of symlinking
    try {
      fs.copyFileSync(platformBinaryPath, binaryPath);
      console.log(`✓ Copied ${packageName} binary: ${expectedBinary}`);
      return true;
    } catch (copyError) {
      console.error(`❌ Failed to copy ${packageName} binary:`, copyError.message);
      return false;
    }
  }
}

/**
 * Fix all native binaries required for the build
 */
function fixAllNativeBinaries() {
  console.log(`🔧 Fixing native binaries for ${process.platform}-${process.arch}...`);
  
  const results = {
    lightningcss: fixNativeBinary('lightningcss', 'lightningcss'),
    tailwindcssOxide: fixNativeBinary('@tailwindcss/oxide', 'tailwindcss-oxide')
  };
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  if (successCount === totalCount) {
    console.log(`✅ All native binaries fixed successfully (${successCount}/${totalCount})`);
  } else {
    console.log(`⚠️  Some native binaries could not be fixed (${successCount}/${totalCount})`);
    console.log('   This may cause build issues. Consider running: npm install --force');
  }
  
  return results;
}

// Main execution
if (require.main === module) {
  fixAllNativeBinaries();
}

module.exports = { 
  fixAllNativeBinaries, 
  fixNativeBinary, 
  getPlatformSuffix, 
  detectLinuxLibc 
};

