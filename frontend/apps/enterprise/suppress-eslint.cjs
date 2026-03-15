const fs = require('fs');
const path = require('path');

const resultsFile = 'eslint-results.txt';
const resultsContent = fs.readFileSync(resultsFile, 'utf8');
const lines = resultsContent.split('\n');

let currentFile = null;
const suppressions = {};

// Parse ESLint output (Default Formatter)
// Format:
// C:\Path\To\File.ts
//   10:5  error  Message  rule-id
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if it's a file path (starts with drive letter)
    if (line.match(/^[A-Z]:\\/)) {
        currentFile = line;
    } else if (currentFile && line.match(/^\d+:\d+\s+error\s+/)) {
        const parts = line.split(/\s+/);
        const position = parts[0].split(':');
        const lineNum = parseInt(position[0]);
        const ruleId = parts[parts.length - 1];

        if (!suppressions[currentFile]) suppressions[currentFile] = [];
        suppressions[currentFile].push({ lineNum, ruleId });
    }
}

// Apply suppressions
Object.entries(suppressions).forEach(([filePath, errorList]) => {
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const fileLines = content.split('\n');
    
    // Sort errors descending by line number to avoid shifting indexes
    errorList.sort((a, b) => b.lineNum - a.lineNum);

    errorList.forEach(({ lineNum, ruleId }) => {
        const index = lineNum - 1;
        if (fileLines[index]) {
            // Check if already disabled
            if (!fileLines[index].includes(`eslint-disable-next-line ${ruleId}`)) {
                const indent = fileLines[index].match(/^\s*/)[0];
                fileLines.splice(index, 0, `${indent}// eslint-disable-next-line ${ruleId} -- TODO(TS-FIX): ${ruleId} Fix during Phase 2/3`);
            }
        }
    });

    fs.writeFileSync(filePath, fileLines.join('\n'), 'utf8');
    console.log(`Suppressed ${errorList.length} errors in ${filePath}`);
});
