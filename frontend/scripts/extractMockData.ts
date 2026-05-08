import { Project, SyntaxKind, ArrayLiteralExpression, ObjectLiteralExpression, Node } from 'ts-morph';
import fs from 'fs';
import path from 'path';

const project = new Project();
project.addSourceFilesAtPaths('c:/Users/avmvi/Project/ERP/frontend/src/pages/**/*MockUI.tsx');

const sourceFiles = project.getSourceFiles();
console.log(`Found ${sourceFiles.length} MockUI files.`);

// A simple eval function that mocks some common icons/variables
function safeEval(text: string) {
    // We replace common Lucide icons with strings
    const icons = ['Activity', 'ArrowUpRight', 'ArrowDownRight', 'Users', 'Box', 'Banknote', 'ShieldCheck', 'Zap', 'AlertTriangle', 'Briefcase', 'ChevronRight', 'Landmark', 'FileSpreadsheet', 'Plus', 'Filter', 'Search', 'RefreshCw', 'X', 'ChevronDown', 'SlidersHorizontal', 'TrendingUp', 'TrendingDown', 'MoreVertical', 'Layers'];
    
    let processedText = text;
    icons.forEach(icon => {
        const regex = new RegExp(`\\b${icon}\\b`, 'g');
        processedText = processedText.replace(regex, `"${icon}"`);
    });

    try {
        // Return evaluated array
        return eval(`(${processedText})`);
    } catch (e) {
        return null; // Failed to eval
    }
}

let modifiedFiles = 0;

for (const sourceFile of sourceFiles) {
    if (sourceFile.getBaseName() === 'DashboardMockUI.tsx') continue; // Already done

    let mockDataJson: Record<string, any> = {};
    let hasReplacements = false;
    let arrayCounter = 1;

    // 1. Extract Top-Level Arrays (const X = [...])
    const varDecls = sourceFile.getVariableDeclarations();
    for (const varDecl of varDecls) {
        const initializer = varDecl.getInitializer();
        if (initializer && initializer.getKind() === SyntaxKind.ArrayLiteralExpression) {
            const arrayLiteral = initializer as ArrayLiteralExpression;
            const elements = arrayLiteral.getElements();
            
            // Only extract if it's an array of objects
            if (elements.length > 0 && elements[0].getKind() === SyntaxKind.ObjectLiteralExpression) {
                const text = arrayLiteral.getText();
                const evaluated = safeEval(text);
                
                if (evaluated && Array.isArray(evaluated)) {
                    const keyName = varDecl.getName();
                    mockDataJson[keyName] = evaluated;
                    
                    // Replace the array literal with a reference to the json
                    arrayLiteral.replaceWithText(`mockData.${keyName}`);
                    hasReplacements = true;
                }
            }
        }
    }

    // 2. Extract Inline Arrays inside JSX (e.g., {[...].map()})
    const arrayLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.ArrayLiteralExpression);
    for (const arrayLiteral of arrayLiterals) {
        // Check if parent is a PropertyAccessExpression with name 'map'
        const parent = arrayLiteral.getParent();
        if (parent && parent.getKind() === SyntaxKind.PropertyAccessExpression) {
            const propAccess = parent as import('ts-morph').PropertyAccessExpression;
            if (propAccess.getName() === 'map') {
                const elements = arrayLiteral.getElements();
                if (elements.length > 0 && elements[0].getKind() === SyntaxKind.ObjectLiteralExpression) {
                    const text = arrayLiteral.getText();
                    const evaluated = safeEval(text);
                    
                    if (evaluated && Array.isArray(evaluated)) {
                        const keyName = `inlineArray${arrayCounter++}`;
                        mockDataJson[keyName] = evaluated;
                        
                        // Replace inline array
                        arrayLiteral.replaceWithText(`mockData.${keyName}`);
                        hasReplacements = true;
                    }
                }
            }
        }
    }

    if (hasReplacements) {
        const baseName = sourceFile.getBaseNameWithoutExtension();
        const jsonFileName = `${baseName}Data.json`;
        const jsonFilePath = path.join('c:/Users/avmvi/Project/ERP/frontend/src/mockData', jsonFileName);
        
        // Write JSON
        fs.writeFileSync(jsonFilePath, JSON.stringify(mockDataJson, null, 2), 'utf-8');
        
        // Add Import
        sourceFile.addImportDeclaration({
            defaultImport: 'mockData',
            moduleSpecifier: `../../mockData/${jsonFileName}`
        });

        // Add IconMap if we need it
        // (For simplicity, we assume the components will adjust or we manually fix icon rendering)
        
        sourceFile.saveSync();
        modifiedFiles++;
        console.log(`Refactored ${baseName}`);
    }
}

console.log(`Successfully refactored ${modifiedFiles} files.`);
