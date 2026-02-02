const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Configuration
const srcDir = path.resolve(__dirname, 'src');

// Symbol Map: Symbol -> Absolute Path based on srcDir
// We define paths relative to srcDir for easier mapping
const symbolMap = {
    // Services
    'api': 'services/api.js',

    // Components
    'Layout': 'components/shared/Layout/Layout', // or index
    'PageHeader': 'components/shared/Layout/PageHeader',
    'FormInput': 'components/core/Form/Input',
    'CustomerSelectionModal': 'components/Customers/CustomerSelectionModal',
    'ItemSelectionModal': 'components/Inventory/ItemSelectionModal',
    'PaymentModal': 'components/Finance/PaymentModal',
    'EstimateTemplate': 'components/Sales/EstimateTemplate',

    // Redux Actions / Hooks
    'getAllItems': 'redux/slices/inventorySlice.js',
    'getAllCustomers': 'redux/slices/customerSlice.js',
    'getAllInvoices': 'redux/slices/posSlice.ts',
    'deleteInvoice': 'redux/slices/posSlice.ts',
    'resetPosState': 'redux/slices/posSlice.ts',
    'useExpenses': 'hooks/useExpenses.ts',
    'useExpenseCategories': 'hooks/useExpenseCategories.ts',

    // Add more as discovered from grep output
    'getSalesInvoiceById': 'redux/slices/salesInvoiceSlice.js', // guess
    'reset': 'redux/slices/salesInvoiceSlice.js', // ambiguous, handle carefully
    'clearSalesInvoice': 'redux/slices/salesInvoiceSlice.js',
    'markSalesInvoiceAsPaid': 'redux/slices/salesInvoiceSlice.js',

    'getAllExpenses': 'redux/slices/expenseSlice.ts',
    'createExpense': 'redux/slices/expenseSlice.ts',
    'deleteExpense': 'redux/slices/expenseSlice.ts',
    'getAccounts': 'redux/slices/cashbankSlice.ts', // guess

    'updateProfile': 'redux/slices/authSlice.ts',
    'resetAuthState': 'redux/slices/authSlice.ts',

    'updateItem': 'redux/slices/inventorySlice.js',
    'addItem': 'redux/slices/inventorySlice.js',
    'getItemById': 'redux/slices/inventorySlice.js',
    'authReducer': 'redux/slices/authSlice.ts',

    // Sales / Delivery Challan
    'SalesOrderSelectionModal': 'components/Sales/SalesOrderSelectionModal',
    'createDeliveryChallan': 'redux/slices/deliveryChallanSlice.js',
    'getAllDeliveryChallans': 'redux/slices/deliveryChallanSlice.js',
    'getDeliveryChallanById': 'redux/slices/deliveryChallanSlice.js',
    'getAllSalesInvoices': 'redux/slices/salesInvoiceSlice.js',
    'getSalesInvoiceById': 'redux/slices/salesInvoiceSlice.js',
};

async function walk(dir) {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.promises.stat(filePath);
        if (stat.isDirectory()) {
            await walk(filePath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
            await processFile(filePath);
        }
    }
}

async function processFile(filePath) {
    let content = await fs.promises.readFile(filePath, 'utf8');
    let originalContent = content;

    // Regex to capture "import ... from './'" or "from "./""
    // Groups: 1=named block, 2=default export
    const regex = /import\s+(?:{\s*([^}]+)\s*}|([a-zA-Z0-9_]+))\s+from\s+["'](\.\/|\.\/)["'];?/g;

    content = content.replace(regex, (match, namedBlock, defaultExport) => {
        let targetPathRelToSrc = null;

        if (defaultExport) {
            targetPathRelToSrc = symbolMap[defaultExport];
            if (!targetPathRelToSrc) {
                console.warn(`[WARN] Unknown default export '${defaultExport}' in ${filePath}`);
                return match;
            }
        } else if (namedBlock) {
            // Take the first named export to guess the file
            const firstSymbol = namedBlock.split(',')[0].trim();
            targetPathRelToSrc = symbolMap[firstSymbol];
            if (!targetPathRelToSrc) {
                // Try manual fallbacks / ambiguous checks
                if (firstSymbol === 'reset') {
                    // Could be many things. Skip or guess?
                    // In SalesInvoiceDetail -> salesInvoiceSlice
                    // In Expenses -> expenseSlice
                    // This is risky.
                    // But usually mapped via symbolMap.
                    console.warn(`[WARN] Ambiguous/Unknown named export '${firstSymbol}' in ${filePath}`);
                    return match;
                }
                console.warn(`[WARN] Unknown named export '${firstSymbol}' in ${filePath}`);
                return match;
            }
        } else {
            return match;
        }

        if (targetPathRelToSrc) {
            const targetAbsPath = path.join(srcDir, targetPathRelToSrc);

            // If targetAbsPath includes extension, keep it? 
            // My map has extensions for some.
            // Vite works better with relative paths + extensions if JS.

            let relPath = path.relative(path.dirname(filePath), targetAbsPath);
            relPath = relPath.replace(/\\/g, '/');
            if (!relPath.startsWith('.')) relPath = './' + relPath;

            // Remove extension for TS/TSX import if preferred, or keep it.
            // Keeping it is safer for JS files.

            console.log(`Fixing ${path.basename(filePath)}: ${match} -> ${relPath}`);
            return match.replace(/["'](\.\/|\.\/)["']/, `"${relPath}"`);
        }

        return match;
    });

    if (content !== originalContent) {
        await fs.promises.writeFile(filePath, content, 'utf8');
    }
}

walk(srcDir).catch(console.error);
