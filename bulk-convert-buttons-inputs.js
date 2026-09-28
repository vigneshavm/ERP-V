#!/usr/bin/env node
/**
 * Button & Input Standardization Automation Script
 * Converts 700+ raw <button> and <input> tags to shared Button/Input components
 * Usage: node bulk-convert-buttons-inputs.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FEATURES_DIR = path.join(__dirname, 'frontend/src/features');
const BUTTON_IMPORT = "import { Button } from '@/components/shared/Button';";
const INPUT_IMPORT = "import { Input } from '@/components/shared/Input';";

const fileStats = {
  processed: 0,
  updated: 0,
  errors: [],
  filesModified: []
};

/**
 * Recursively find all .tsx files in features directory
 */
function findTsxFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...findTsxFiles(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      files.push(fullPath);
    }
  });
  return files;
}

/**
 * Check if file needs Button/Input imports
 */
function hasButtonImport(content) {
  return /import.*Button.*from.*components/.test(content);
}

function hasInputImport(content) {
  return /import.*Input.*from.*components/.test(content);
}

/**
 * Add imports to file if missing
 */
function addImports(content, needsButton, needsInput) {
  let modified = content;
  const firstImportMatch = modified.match(/^import\s/m);
  
  if (!firstImportMatch) {
    // No imports found, add at top
    if (needsButton) modified = BUTTON_IMPORT + '\n' + modified;
    if (needsInput) modified = INPUT_IMPORT + '\n' + modified;
    return modified;
  }

  // Add after last import statement
  const lastImportIdx = modified.lastIndexOf('\n', modified.search(/^[^i]/m));
  let insertIdx = lastImportIdx !== -1 ? lastImportIdx + 1 : 0;

  // Find the actual last import line
  const importMatches = [...modified.matchAll(/^import\s.*from\s['"].*['"];?$/gm)];
  if (importMatches.length > 0) {
    insertIdx = importMatches[importMatches.length - 1].index + importMatches[importMatches.length - 1][0].length + 1;
  }

  let importsToAdd = '';
  if (needsButton && !hasButtonImport(modified)) importsToAdd += BUTTON_IMPORT + '\n';
  if (needsInput && !hasInputImport(modified)) importsToAdd += INPUT_IMPORT + '\n';

  if (importsToAdd) {
    modified = modified.slice(0, insertIdx) + importsToAdd + modified.slice(insertIdx);
  }

  return modified;
}

/**
 * Convert raw buttons to Button component
 */
function convertButtons(content) {
  // Pattern 1: Simple button with onClick and className
  content = content.replace(
    /<button\s+onClick=\{([^}]+)\}\s+className="([^"]+)"\s*>\s*{?\s*([^}]*?)\s*}?\s*<\/button>/g,
    '<Button onClick={$1} className="$2">$3</Button>'
  );

  // Pattern 2: Button with className first
  content = content.replace(
    /<button\s+className="([^"]+)"\s+onClick=\{([^}]+)\}\s*>\s*([^<]*?)\s*<\/button>/g,
    '<Button className="$1" onClick={$2}>$3</Button>'
  );

  // Pattern 3: Simple button with just className
  content = content.replace(
    /<button\s+className="([^"]+)"\s*>\s*([^<]*?)\s*<\/button>/g,
    '<Button className="$1">$2</Button>'
  );

  // Pattern 4: Button with disabled prop
  content = content.replace(
    /<button\s+onClick=\{([^}]+)\}\s+disabled=\{([^}]+)\}\s+className="([^"]+)"\s*>\s*([^<]*?)\s*<\/button>/g,
    '<Button onClick={$1} disabled={$2} className="$3">$4</Button>'
  );

  // Pattern 5: Button with type attribute
  content = content.replace(
    /<button\s+type="([^"]+)"\s+onClick=\{([^}]+)\}\s+className="([^"]+)"\s*>\s*([^<]*?)\s*<\/button>/g,
    '<Button type="$1" onClick={$2} className="$3">$4</Button>'
  );

  // Pattern 6: Form submit button with className only
  content = content.replace(
    /<button\s+type="submit"\s+className="([^"]+)"\s*>\s*([^<]*?)\s*<\/button>/g,
    '<Button type="submit" className="$1">$2</Button>'
  );

  return content;
}

/**
 * Convert raw inputs to Input component
 * Excludes: checkbox, radio, hidden, file, color type inputs
 */
function convertInputs(content) {
  // Pattern 1: Text input with value and onChange
  content = content.replace(
    /<input\s+type="text"\s+placeholder="([^"]+)"\s+className="([^"]+)"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s*\/>/g,
    '<Input type="text" placeholder="$1" className="$2" value={$3} onChange={$4} />'
  );

  // Pattern 2: Text input with different attribute order
  content = content.replace(
    /<input\s+type="text"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+placeholder="([^"]+)"\s+className="([^"]+)"\s*\/>/g,
    '<Input type="text" value={$1} onChange={$2} placeholder="$3" className="$4" />'
  );

  // Pattern 3: Email input
  content = content.replace(
    /<input\s+type="email"\s+([^>]*?)className="([^"]+)"([^>]*?)\/>/g,
    '<Input type="email" $1className="$2"$3/>'
  );

  // Pattern 4: Date input
  content = content.replace(
    /<input\s+type="date"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+className="([^"]+)"\s*\/>/g,
    '<Input type="date" value={$1} onChange={$2} className="$3" />'
  );

  // Pattern 5: Number input
  content = content.replace(
    /<input\s+type="number"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+placeholder="([^"]+)"\s+className="([^"]+)"\s*\/>/g,
    '<Input type="number" value={$1} onChange={$2} placeholder="$3" className="$4" />'
  );

  // Pattern 6: Tel input
  content = content.replace(
    /<input\s+type="tel"\s+value=\{([^}]+)\}\s+onChange=\{([^}]+)\}\s+placeholder="([^"]+)"\s+className="([^"]+)"\s*\/>/g,
    '<Input type="tel" value={$1} onChange={$2} placeholder="$3" className="$4" />'
  );

  return content;
}

/**
 * Check if file has raw buttons or inputs that need conversion
 */
function needsConversion(content) {
  const hasRawButtons = /<button[^>]*className=/.test(content) && !/<Button/.test(content);
  const hasRawInputs = /<input\s+type="(text|email|date|number|tel|password|search|url)"/.test(content) && !/<Input/.test(content);
  return { hasRawButtons, hasRawInputs };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  fileStats.processed++;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { hasRawButtons, hasRawInputs } = needsConversion(content);

    if (!hasRawButtons && !hasRawInputs) {
      return; // File doesn't need conversion
    }

    let modified = content;

    // Add imports if needed
    modified = addImports(modified, hasRawButtons, hasRawInputs);

    // Convert buttons
    if (hasRawButtons) {
      modified = convertButtons(modified);
    }

    // Convert inputs
    if (hasRawInputs) {
      modified = convertInputs(modified);
    }

    // Write back if changed
    if (modified !== content) {
      fs.writeFileSync(filePath, modified);
      fileStats.updated++;
      fileStats.filesModified.push(path.relative(FEATURES_DIR, filePath));
      console.log(`✓ Updated: ${path.relative(FEATURES_DIR, filePath)}`);
    }
  } catch (error) {
    fileStats.errors.push({
      file: filePath,
      error: error.message
    });
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔄 Starting Button/Input Standardization Conversion...\n');

  const files = findTsxFiles(FEATURES_DIR);
  console.log(`Found ${files.length} TypeScript/React files to scan\n`);

  files.forEach(processFile);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('CONVERSION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total files scanned: ${fileStats.processed}`);
  console.log(`Files updated: ${fileStats.updated}`);
  console.log(`Errors encountered: ${fileStats.errors.length}`);

  if (fileStats.filesModified.length > 0) {
    console.log('\nFiles Modified:');
    fileStats.filesModified.forEach(f => console.log(`  - ${f}`));
  }

  if (fileStats.errors.length > 0) {
    console.log('\nErrors:');
    fileStats.errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
  }

  console.log('\n✨ Conversion complete!');
  console.log('Next steps:');
  console.log('1. Run: npm run build --workspace=frontend');
  console.log('2. Fix any TypeScript errors');
  console.log('3. Run: npm run lint --workspace=frontend');
  console.log('4. Commit changes');
}

main();
