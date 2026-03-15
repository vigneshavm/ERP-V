const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let hasChanges = false;

    // 1. Replace usages of state.auth.user?.token from thunks
    const tokenRegex = /const\s+token\s*=\s*state\.auth\.user\?\.token;/g;
    if (tokenRegex.test(content)) {
        content = content.replace(tokenRegex, 'const { token } = useAuthStore.getState();');
        hasChanges = true;
    }

    // 2. Replace instances assigning `const auth = useSelector(state => state.auth)` with `useAuthStore`
    // Includes variants with type assertion
    const fullAuthRegex = /const\s+auth\s*=\s*useSelector\(\s*\([^)]+\)\s*=>\s*state\.auth\s*\);/g;
    if (fullAuthRegex.test(content)) {
        content = content.replace(fullAuthRegex, 'const auth = useAuthStore();');
        hasChanges = true;
    }

    // 3. Replace instances of single user variable without destructuring the state parameter correctly (e.g. state => state.auth)
    const userOnlyRegex = /const\s+\{\s*user\s*\}\s*=\s*useSelector\(\s*\(\s*state[^)]*\)\s*=>\s*state\.auth\s*\);/g;
    if (userOnlyRegex.test(content)) {
        content = content.replace(userOnlyRegex, 'const { user } = useAuthStore();');
        hasChanges = true;
    }
    
    // 4. In thunks we retrieve the whole state.auth 
    const thunkAuthRegex = /state\.auth/g;
    if (thunkAuthRegex.test(content) && !file.includes('authSlice.ts') && !file.includes('store.ts') && file.includes('entities/')) {
        // Only if we haven't already replaced it above, this is a dangerous blanket replace, but we just need `useAuthStore.getState()`
        // A safer way is specifically replacing occurrences like state.auth.user
        content = content.replace(/state\.auth\.user/g, 'useAuthStore.getState().user');
        content = content.replace(/state\.auth\.currentSector/g, 'useAuthStore.getState().user?.sector');
        content = content.replace(/state\.auth\.currentBranch/g, 'useAuthStore.getState().user?.branch');
        hasChanges = true;
    }

    if (hasChanges) {
        if (!content.includes('useAuthStore')) {
            content = "import { useAuthStore } from '@repo/shared';\n" + content;
        }
        fs.writeFileSync(file, content);
        changedFiles++;
    }
});

console.log('Modified ' + changedFiles + ' files.');
