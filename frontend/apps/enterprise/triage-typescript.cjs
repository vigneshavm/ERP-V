const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * TypeScript Triage Script
 * Runs tsc --noEmit, parses errors, and generates a markdown report.
 */

const TSC_COMMAND = 'npx tsc --noEmit';

console.log('🚀 Running TypeScript type check...');

exec(TSC_COMMAND, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    // tsc returns exit code 1 if errors are found, so we check stdout even if error is true
    const output = stdout || stderr;
    const lines = output.split('\n');
    
    const errorsByCode = {};
    const errorsByModule = {};
    let totalErrors = 0;

    // Pattern to match: src/views/Dashboard/ui/Dashboard.tsx(10,5): error TS2322: Type '...' is not assignable to type '...'.
    const errorRegex = /^(.*)\((\d+),(\d+)\): error (TS\d+): (.*)$/;

    lines.forEach(line => {
        const match = line.match(errorRegex);
        if (match) {
            const [_, filePath, lineNum, colNum, errorCode, message] = match;
            totalErrors++;

            // Categorize by code
            errorsByCode[errorCode] = (errorsByCode[errorCode] || 0) + 1;

            // Categorize by module (top-level directory in src)
            const parts = filePath.split(path.sep);
            const srcIndex = parts.indexOf('src');
            const moduleName = srcIndex !== -1 && parts[srcIndex + 1] ? parts[srcIndex + 1] : 'root';
            errorsByModule[moduleName] = (errorsByModule[moduleName] || 0) + 1;
        }
    });

    if (totalErrors === 0) {
        console.log('✅ No TypeScript errors found!');
        return;
    }

    // Generate Markdown Report
    let report = `# TypeScript Migration Triage Report\n\n`;
    report += `**Total Errors:** ${totalErrors}\n\n`;

    report += `## Errors by Type\n\n`;
    report += `| Error Code | Count | Description |\n`;
    report += `| --- | --- | --- |\n`;
    
    const sortedCodes = Object.entries(errorsByCode).sort((a, b) => b[1] - a[1]);
    sortedCodes.forEach(([code, count]) => {
        report += `| ${code} | ${count} | ${getDescription(code)} |\n`;
    });

    report += `\n## Errors by Module\n\n`;
    report += `| Module | Count |\n`;
    report += `| --- | --- |\n`;
    
    const sortedModules = Object.entries(errorsByModule).sort((a, b) => b[1] - a[1]);
    sortedModules.forEach(([mod, count]) => {
        report += `| ${mod} | ${count} |\n`;
    });

    report += `\n\n*Generated on ${new Date().toISOString()}*\n`;

    fs.writeFileSync('ts-triage-report.md', report);
    console.log(`\n📊 Report generated: ts-triage-report.md`);
    console.log(`Total Errors found: ${totalErrors}`);
});

function getDescription(code) {
    const descriptions = {
        'TS2322': 'Type assignment mismatch',
        'TS2345': 'Argument type mismatch',
        'TS7006': 'Implicit any',
        'TS2339': 'Property does not exist on type',
        'TS2304': 'Cannot find name',
        'TS2532': 'Object is possibly undefined',
        'TS2769': 'No overload matches this call',
        'TS4090': 'Public property refers to private type',
    };
    return descriptions[code] || 'Other TypeScript error';
}
