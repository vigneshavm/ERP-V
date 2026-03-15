const fs = require('fs');
const path = 'c:/Users/avmvi/Project/ERP/frontend/apps/enterprise/src/shared/ui/Layout/Sidebar.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/value=\{selectedBranch\}/g, 'value={selectedBranch || "All"}');
content = content.replace(/theme=\{theme \|\| 'light'\}/g, "theme={(theme as any) || 'light'}");
fs.writeFileSync(path, content);
console.log('Sidebar.tsx updated');
