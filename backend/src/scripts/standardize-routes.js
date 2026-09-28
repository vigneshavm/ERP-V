#!/usr/bin/env node

/**
 * Route File Standardization Script
 * Renames all PascalCase *Routes.ts to camelCase *.routes.ts
 * and updates all import statements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODULES_DIR = path.join(__dirname, '../modules');
const APP_FILE = path.join(__dirname, '../app.ts');

// Track all renames for import updates
const renames = [];

/**
 * Convert PascalCase filename to camelCase
 * e.g., "purchasePaymentRoutes.ts" -> "purchasePayment.routes.ts"
 */
function convertFilename(filename) {
    if (!filename.endsWith('Routes.ts')) {
        return null;
    }
    
    const basename = filename.replace(/Routes\.ts$/, '');
    return `${basename}.routes.ts`;
}

/**
 * Recursively find all *Routes.ts files
 */
function findRoutesFiles(dir) {
    const files = [];
    
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                files.push(...findRoutesFiles(fullPath));
            } else if (entry.isFile() && entry.name.endsWith('Routes.ts')) {
                files.push(fullPath);
            }
        }
    } catch (err) {
        console.error(`Error reading directory ${dir}:`, err.message);
    }
    
    return files;
}

/**
 * Rename a single file and track the change
 */
function renameFile(oldPath) {
    const dir = path.dirname(oldPath);
    const oldFilename = path.basename(oldPath);
    const newFilename = convertFilename(oldFilename);
    
    if (!newFilename) {
        return null;
    }
    
    const newPath = path.join(dir, newFilename);
    
    // Skip if file already exists or is the same name
    if (oldPath === newPath || fs.existsSync(newPath)) {
        console.log(`⏭️  Skipping ${oldFilename} (target already exists)`);
        return null;
    }
    
    try {
        // Use fs.renameSync for better compatibility
        fs.renameSync(oldPath, newPath);
        console.log(`✅ Renamed: ${oldFilename} → ${newFilename}`);
        
        // Track for import updates
        const importName = oldFilename.replace(/\.ts$/, '');
        const newImportName = newFilename.replace(/\.ts$/, '');
        
        return {
            oldPath,
            newPath,
            oldImportName: importName,
            newImportName: newImportName,
            relativePath: path.relative(path.join(__dirname, '..'), newPath)
        };
    } catch (err) {
        console.error(`❌ Error renaming ${oldFilename}:`, err.message);
        return null;
    }
}

/**
 * Update imports in a file
 */
function updateImportsInFile(filePath, renames) {
    if (!fs.existsSync(filePath)) {
        return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    for (const rename of renames) {
        // Match patterns like: import something from "./path/oldName.js"
        const patterns = [
            new RegExp(`from\\s+["']([^"']*?${rename.oldImportName})(\\.js)?["']`, 'g'),
            new RegExp(`require\\(["']([^"']*?${rename.oldImportName})(\\.js)?["']\\)`, 'g')
        ];
        
        for (const pattern of patterns) {
            const matches = content.match(pattern);
            if (matches) {
                const newPath = rename.relativePath.replace(/\\/g, '/').replace(/\.ts$/, '.js');
                
                // Replace the old import path with new one
                const oldImportPath = `./${rename.oldImportName}`;
                const newImportPath = `./${rename.newImportName}`;
                
                const before = content;
                content = content.replace(
                    new RegExp(`from\\s+["']([^"']*)${rename.oldImportName}(\\.js)?["']`, 'g'),
                    `from "$1${newImportPath}.js"`
                );
                content = content.replace(
                    new RegExp(`require\\(["']([^"']*)${rename.oldImportName}(\\.js)?["']\\)`, 'g'),
                    `require("$1${newImportPath}.js")`
                );
                
                if (before !== content) {
                    updated = true;
                }
            }
        }
    }
    
    if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    
    return false;
}

/**
 * Main execution
 */
function main() {
    console.log('\n🔍 Scanning for PascalCase *Routes.ts files...\n');
    
    const routesFiles = findRoutesFiles(MODULES_DIR);
    console.log(`Found ${routesFiles.length} *Routes.ts files\n`);
    
    if (routesFiles.length === 0) {
        console.log('✅ No files to rename. All routes already follow *.routes.ts pattern!');
        return;
    }
    
    console.log('📝 Renaming files...\n');
    
    const successfulRenames = [];
    for (const file of routesFiles) {
        const result = renameFile(file);
        if (result) {
            successfulRenames.push(result);
        }
    }
    
    if (successfulRenames.length === 0) {
        console.log('\n⚠️  No files were renamed.');
        return;
    }
    
    console.log(`\n✅ Successfully renamed ${successfulRenames.length} files\n`);
    
    // Update imports in app.ts
    console.log('🔄 Updating imports in app.ts...\n');
    
    if (updateImportsInFile(APP_FILE, successfulRenames)) {
        console.log('✅ Updated app.ts\n');
    }
    
    // Scan for other TypeScript files that might import these routes
    console.log('🔄 Scanning for other files that import routes...\n');
    
    const allTsFiles = findAllTypeScriptFiles(path.join(__dirname, '..'));
    let otherUpdates = 0;
    
    for (const tsFile of allTsFiles) {
        if (tsFile === APP_FILE) continue; // Already handled
        
        if (updateImportsInFile(tsFile, successfulRenames)) {
            console.log(`✅ Updated ${path.relative(path.join(__dirname, '..'), tsFile)}`);
            otherUpdates++;
        }
    }
    
    console.log(`\n✅ Updated ${otherUpdates} additional files\n`);
    
    // Summary
    console.log('📋 Summary of changes:\n');
    for (const rename of successfulRenames) {
        console.log(`  ${rename.oldImportName} → ${rename.newImportName}`);
    }
    
    console.log('\n✨ Route file standardization complete!\n');
}

/**
 * Find all TypeScript files for import updates
 */
function findAllTypeScriptFiles(dir, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) return [];
    
    const files = [];
    
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue;
            if (entry.name === 'node_modules') continue;
            if (entry.name === 'dist') continue;
            
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                files.push(...findAllTypeScriptFiles(fullPath, maxDepth, currentDepth + 1));
            } else if (entry.isFile() && entry.name.endsWith('.ts')) {
                files.push(fullPath);
            }
        }
    } catch (err) {
        // Ignore permission errors
    }
    
    return files;
}

// Run the script
main();
