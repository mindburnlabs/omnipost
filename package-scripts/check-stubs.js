
#!/usr/bin/env node

/**
 * Build-time script to detect stub/mock/placeholder references in production code
 * Fails the build if prohibited patterns are found outside allowed directories
 */

const fs = require('fs');
const path = require('path');

const PROHIBITED_PATTERNS = [
  /\b(demo|mock|stub|placeholder|temp|fake)\b/gi,
  /\b(test_\w+|sample_\w+|example_\w+)\b/gi,
  /\/\*\s*(TODO|FIXME|HACK|XXX).*stub.*\*\//gi,
  /\/\/.*stub.*implementation/gi
];

const ALLOWED_DIRECTORIES = [
  'demo',
  'test',
  'tests',
  '__tests__',
  'docs',
  'documentation',
  'examples',
  'package-scripts'
];

const PRODUCTION_PATHS = [
  'src/app',
  'src/lib',
  'src/components'
];

function isAllowedPath(filePath) {
  return ALLOWED_DIRECTORIES.some(dir => 
    filePath.includes(`/${dir}/`) || 
    filePath.includes(`\\${dir}\\`) ||
    filePath.endsWith('.test.ts') ||
    filePath.endsWith('.test.tsx') ||
    filePath.endsWith('.spec.ts') ||
    filePath.endsWith('.spec.tsx')
  );
}

function isProductionPath(filePath) {
  return PRODUCTION_PATHS.some(prodPath => 
    filePath.includes(prodPath.replace('/', path.sep))
  );
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];

    PROHIBITED_PATTERNS.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const lines = content.substring(0, content.indexOf(match)).split('\n');
          const lineNumber = lines.length;
          
          violations.push({
            file: filePath,
            line: lineNumber,
            pattern: match,
            patternIndex: index
          });
        });
      }
    });

    return violations;
  } catch (error) {
    console.warn(`Warning: Could not scan ${filePath}:`, error.message);
    return [];
  }
}

function scanDirectory(dirPath) {
  const violations = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        if (!item.startsWith('.') && !item.startsWith('node_modules')) {
          violations.push(...scanDirectory(itemPath));
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
          // Only scan production paths, skip allowed directories
          if (isProductionPath(itemPath) && !isAllowedPath(itemPath)) {
            violations.push(...scanFile(itemPath));
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dirPath}:`, error.message);
  }
  
  return violations;
}

function main() {
  console.log('🔍 Scanning for stub/mock/placeholder patterns in production code...');
  
  const violations = scanDirectory('.');
  
  if (violations.length === 0) {
    console.log('✅ No prohibited patterns found in production code');
    process.exit(0);
  } else {
    console.error('❌ Found prohibited patterns in production code:');
    console.error('');
    
    violations.forEach(violation => {
      console.error(`  ${violation.file}:${violation.line}`);
      console.error(`    Pattern: "${violation.pattern}"`);
      console.error('');
    });
    
    console.error(`Total violations: ${violations.length}`);
    console.error('');
    console.error('These patterns are not allowed in production code.');
    console.error('Move to /demo, /tests, or /docs directories, or use real implementations.');
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scanDirectory, scanFile, isAllowedPath, isProductionPath };
