const { exec } = require('child_process');
const fs = require('fs');

/**
 * ESLint Triage Script
 */

const ESLINT_COMMAND = 'node c:\\Users\\avmvi\\Project\\ERP\\node_modules\\eslint\\bin\\eslint.js . --format json';

console.log('🚀 Running ESLint check...');

exec(ESLINT_COMMAND, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
    let results;
    try {
        results = JSON.parse(stdout);
    } catch (e) {
        console.error('Failed to parse ESLint output', e);
        return;
    }

    const errorsByRule = {};
    const errorsByModule = {};
    let totalErrors = 0;

    results.forEach(fileResult => {
        fileResult.messages.forEach(msg => {
            if (msg.severity === 2) { // Error
                totalErrors++;
                errorsByRule[msg.ruleId] = (errorsByRule[msg.ruleId] || 0) + 1;

                const parts = fileResult.filePath.split(/[\\\/]/);
                const srcIndex = parts.indexOf('src');
                const moduleName = srcIndex !== -1 && parts[srcIndex + 1] ? parts[srcIndex + 1] : 'root';
                errorsByModule[moduleName] = (errorsByModule[moduleName] || 0) + 1;
            }
        });
    });

    if (totalErrors === 0) {
        console.log('✅ No ESLint errors found!');
        return;
    }

    // Generate Markdown Report
    let report = `# ESLint Migration Triage Report\n\n`;
    report += `**Total Errors:** ${totalErrors}\n\n`;

    report += `## Errors by Rule\n\n`;
    report += `| Rule ID | Count |\n`;
    report += `| --- | --- |\n`;
    
    const sortedRules = Object.entries(errorsByRule).sort((a, b) => b[1] - a[1]);
    sortedRules.forEach(([rule, count]) => {
        report += `| ${rule} | ${count} |\n`;
    });

    report += `\n## Errors by Module\n\n`;
    report += `| Module | Count |\n`;
    report += `| --- | --- |\n`;
    
    const sortedModules = Object.entries(errorsByModule).sort((a, b) => b[1] - a[1]);
    sortedModules.forEach(([mod, count]) => {
        report += `| ${mod} | ${count} |\n`;
    });

    fs.writeFileSync('eslint-triage-report.md', report);
    console.log(`\n📊 Report generated: eslint-triage-report.md`);
    console.log(`Total Errors found: ${totalErrors}`);
});
