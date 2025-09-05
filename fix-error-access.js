#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript files
function findTsFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      findTsFiles(fullPath, files);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix the error.errors[0].message pattern
function fixErrorAccess(content) {
  // Replace error.errors[0].message with error.errors[0]?.message || "Validation error"
  return content.replace(
    /error\.errors\[0\]\.message/g,
    'error.errors[0]?.message || "Validation error"'
  );
}

// Main function
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = findTsFiles(srcDir);
  
  let fixedCount = 0;
  
  for (const filePath of tsFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixedContent = fixErrorAccess(content);
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent);
      console.log(`Fixed: ${filePath}`);
      fixedCount++;
    }
  }
  
  console.log(`\nFixed ${fixedCount} files total.`);
}

main();
