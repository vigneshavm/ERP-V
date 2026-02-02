const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve('d:/BizzAI-main/BizzAI-main');
const frontendSrc = path.join(projectRoot, 'frontend/src');

function walkSync(dir, filelist = []) {
    const files = fs.readdirSync(dir);
    files.forEach(function (file) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            filelist = walkSync(filePath, filelist);
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                filelist.push(filePath);
            }
        }
    });
    return filelist;
}

const allFiles = walkSync(frontendSrc);

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Regex to find imports from src_backup
    // Example: ../../../src_backup/types/common
    const regex = /(['"])([^'"]*src_backup\/([^'"]*))(['"])/g;

    content = content.replace(regex, (match, quote, fullPath, relativeToBackup, endQuote) => {
        // relativeToBackup is something like 'types/common'
        // We want to point to frontend/src/relativeToBackup
        const targetFilePath = path.join(frontendSrc, relativeToBackup);

        // Calculate relative path from current file directory to target file
        const currentDir = path.dirname(file);
        let newRelativePath = path.relative(currentDir, targetFilePath);

        // Normalize path separators for imports (always use /)
        newRelativePath = newRelativePath.replace(/\\/g, '/');

        // path.relative might return 'types/common' without leading './', let's fix it
        if (!newRelativePath.startsWith('.')) {
            newRelativePath = './' + newRelativePath;
        }

        // Remove file extensions if present in the import path (optional, but standard for TS)
        // Actually, it's safer to keep the path part as is unless we know it's a TS file
        // But relativeToBackup might include .ts, let's strip it if it's there
        newRelativePath = newRelativePath.replace(/\.(ts|tsx|js|jsx)$/, '');

        console.log(`Replacing in ${path.relative(frontendSrc, file)}: ${fullPath} -> ${newRelativePath}`);
        changed = true;
        return `${quote}${newRelativePath}${endQuote}`;
    });

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
    }
});
