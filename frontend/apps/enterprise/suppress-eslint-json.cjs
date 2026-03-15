const fs = require('fs');
const path = require('path');

const resultsFile = 'eslint-results.json';

if (!fs.existsSync(resultsFile)) {
    console.error(`File not found: ${resultsFile}`);
    process.exit(1);
}

const rawData = fs.readFileSync(resultsFile, 'utf8');
let results;
try {
    results = JSON.parse(rawData);
} catch (e) {
    console.error('Failed to parse JSON:', e);
    process.exit(1);
}

let totalSuppressed = 0;

results.forEach(fileResult => {
    // Only process files with errors
    const errors = fileResult.messages.filter(msg => msg.severity === 2);
    if (errors.length === 0) return;

    const filePath = fileResult.filePath;
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const fileLines = content.split('\n');

    // Group errors by line number
    const errorsByLine = {};
    errors.forEach(err => {
        if (!err.line) return;
        if (!errorsByLine[err.line]) {
            errorsByLine[err.line] = new Set();
        }
        errorsByLine[err.line].add(err.ruleId);
    });

    // Sort lines in descending order to insert without affecting subsequent line numbers
    const linesToProcess = Object.keys(errorsByLine).map(Number).sort((a, b) => b - a);

    linesToProcess.forEach(lineNum => {
        const ruleIds = Array.from(errorsByLine[lineNum]);
        const index = lineNum - 1; // 0-indexed array
        
        if (fileLines[index]) {
            const ruleString = ruleIds.join(', ');
            // Prevent duplicate suppression comments
            if (!fileLines[index].includes(`eslint-disable-next-line ${ruleString}`)) {
                const indentMatch = fileLines[index].match(/^\s*/);
                const indent = indentMatch ? indentMatch[0] : '';
                fileLines.splice(index, 0, `${indent}// eslint-disable-next-line ${ruleString} -- TODO(TS-FIX): Phase 2/3 fix`);
                totalSuppressed += ruleIds.length;
            }
        }
    });

    fs.writeFileSync(filePath, fileLines.join('\n'), 'utf8');
    console.log(`Updated ${filePath} (Suppressed ${errors.length} errors)`);
});

console.log(`\n✅ Total errors suppressed: ${totalSuppressed}`);
