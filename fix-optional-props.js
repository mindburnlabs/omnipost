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

// Function to fix exactOptionalPropertyTypes issues
function fixOptionalProps(content) {
  // This is a simple fix that may need manual review
  // Replace patterns where we pass objects with potentially undefined properties
  
  let fixed = content;
  
  // Pattern 1: Fix common object spread issues
  fixed = fixed.replace(
    /(\w+): validatedData\.(\w+),?\s*$/gm,
    (match, key, prop) => {
      if (prop.includes('Token') || prop === 'temperature' || prop === 'image' || prop === 'userId' || prop === 'workspaceId') {
        return `...(validatedData.${prop} !== undefined ? { ${key}: validatedData.${prop} } : {}),`;
      }
      return match;
    }
  );
  
  return fixed;
}

// More targeted fix function
function fixObjectAssignments(content) {
  // Look for object assignments that might have undefined optional properties
  const lines = content.split('\n');
  let modified = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for lines that might be passing undefined optional properties
    if (line.includes('validatedData.') && (
      line.includes('maxTokens') || 
      line.includes('temperature') || 
      line.includes('image') || 
      line.includes('userId') ||
      line.includes('workspaceId')
    )) {
      // This is a simplified fix - we'll just add a comment for manual review
      if (!line.includes('// TODO: Fix optional property')) {
        lines[i] = line + ' // TODO: Fix optional property';
        modified = true;
      }
    }
  }
  
  return modified ? lines.join('\n') : content;
}

// Main function
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = findTsFiles(srcDir);
  
  let fixedCount = 0;
  
  for (const filePath of tsFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixedContent = fixObjectAssignments(content);
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent);
      console.log(`Marked for review: ${filePath}`);
      fixedCount++;
    }
  }
  
  console.log(`\nMarked ${fixedCount} files for manual review.`);
  console.log('Please review the TODO comments and fix optional property assignments manually.');
}

main();
