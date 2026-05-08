const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            if (file.endsWith('MockUI.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walkDir('C:/Users/avmvi/Project/ERP/frontend/src/pages');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    if (content.includes('import mockData from')) {
        // Handle both single and double quotes
        content = content.replace(/import mockData from ['"](\.\.\/)+mockData\/(.*?)['"];/g, "import mockData from '@/mockData/$2';");
        fs.writeFileSync(file, content, 'utf-8');
        console.log(`Fixed imports in ${file}`);
    }
});
