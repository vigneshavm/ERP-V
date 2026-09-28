#!/usr/bin/env node

/**
 * Fix remaining orphaned *Routes.ts files
 * These files are sub-routes that need proper naming
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Map of old filenames to new descriptive names
const renames = [
    {
        module: 'purchase',
        oldFile: 'purchaseRoutes.ts',
        newFile: 'purchaseOrder.routes.ts',
        importName: 'purchaseOrderRoutes'
    },
    {
        module: 'sales',
        oldFile: 'posRoutes.ts',
        newFile: 'posInvoice.routes.ts',
        importName: 'posInvoiceRoutes'
    },
    {
        module: 'expense',
        oldFile: 'expenseRoutes.ts',
        newFile: 'expenseMain.routes.ts',
        importName: 'expenseMainRoutes'
    }
];

function renameFile(rename) {
    const dir = path.join(__dirname, `../modules/${rename.module}/routes`);
    const oldPath = path.join(dir, rename.oldFile);
    const newPath = path.join(dir, rename.newFile);
    
    if (!fs.existsSync(oldPath)) {
        console.log(`⏭️  Skipping ${rename.module}/${rename.oldFile} (not found)`);
        return null;
    }
    
    if (fs.existsSync(newPath)) {
        console.log(`⏭️  Skipping ${rename.module}/${rename.oldFile} (target ${rename.newFile} already exists)`);
        return null;
    }
    
    try {
        fs.renameSync(oldPath, newPath);
        console.log(`✅ Renamed: ${rename.module}/${rename.oldFile} → ${rename.newFile}`);
        return rename;
    } catch (err) {
        console.error(`❌ Error renaming ${rename.oldFile}:`, err.message);
        return null;
    }
}

function updateImportsInFile(filePath, oldImportName, newImportName, oldFileName) {
    if (!fs.existsSync(filePath)) {
        return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Match: import something from './oldFile.js'
    const oldFileNoExt = oldFileName.replace(/\.ts$/, '');
    const pattern = new RegExp(`from\\s+['"](\\./)?${oldFileNoExt}(\\.js)?['"']`, 'g');
    
    if (pattern.test(content)) {
        const newFileNoExt = oldFileNoExt.replace('Routes', '').replace(/([A-Z])/g, '-$1').toLowerCase();
        console.log(`  Updating import in ${path.basename(filePath)}`);
        updated = true;
    }
    
    if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    
    return false;
}

function updateAggregatorImports(rename) {
    const aggregatorPath = path.join(
        __dirname,
        `../modules/${rename.module}/routes/${rename.module}.routes.ts`
    );
    
    if (!fs.existsSync(aggregatorPath)) {
        console.log(`⏭️  Aggregator not found: ${rename.module}.routes.ts`);
        return;
    }
    
    let content = fs.readFileSync(aggregatorPath, 'utf8');
    const oldImportName = rename.oldFile.replace(/Routes\.ts$/, 'Routes').replace(/\.ts$/, '');
    const newImportName = rename.newFile.replace(/\.routes\.ts$/, '').replace(/\.ts$/, '');
    
    // Update import statement
    const oldFileNoExt = rename.oldFile.replace(/\.ts$/, '');
    const newFileNoExt = rename.newFile.replace(/\.ts$/, '');
    
    const oldImportLine = `import ${oldImportName} from './${oldFileNoExt}.js'`;
    const newImportLine = `import ${newImportName} from './${newFileNoExt}.js'`;
    
    if (content.includes(oldImportLine)) {
        content = content.replace(oldImportLine, newImportLine);
        console.log(`✅ Updated import in ${rename.module}.routes.ts: ${oldImportName} → ${newImportName}`);
        
        // Also update usage in the file (e.g., router.use('/', purchaseRoutes) → router.use('/', purchaseOrderRoutes))
        content = content.replace(new RegExp(`\\b${oldImportName}\\b`, 'g'), newImportName);
        
        fs.writeFileSync(aggregatorPath, content, 'utf8');
        return true;
    }
    
    return false;
}

function main() {
    console.log('\n🔍 Fixing orphaned sub-route files...\n');
    
    const successful = [];
    
    for (const rename of renames) {
        const result = renameFile(rename);
        if (result) {
            successful.push(result);
        }
    }
    
    if (successful.length === 0) {
        console.log('\n⚠️  No files to rename or fix.');
        return;
    }
    
    console.log(`\n✅ Successfully renamed ${successful.length} files\n`);
    console.log('🔄 Updating aggregator imports...\n');
    
    for (const rename of successful) {
        updateAggregatorImports(rename);
    }
    
    console.log('\n✨ Sub-route file cleanup complete!\n');
}

main();
