#!/usr/bin/env node

/**
 * Update all aggregator route files to use new import names
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const updates = [
    {
        file: 'backend/src/modules/core/routes/core.routes.ts',
        replacements: [
            { old: "import authRoutes from './authRoutes.js'", new: "import auth from './auth.routes.js'" },
            { old: "import userRoutes from './userRoutes.js'", new: "import user from './user.routes.js'" },
            { old: "import businessRoutes from './businessRoutes.js'", new: "import business from './business.routes.js'" },
            { old: "import healthRoutes from './healthRoutes.js'", new: "import health from './health.routes.js'" },
            { old: "import refreshTokenRoutes from './refreshTokenRoutes.js'", new: "import refreshToken from './refreshToken.routes.js'" },
            { old: "import reportRoutes from './reportRoutes.js'", new: "import report from './report.routes.js'" },
            { old: "import settingsRoutes from './settingsRoutes.js'", new: "import settings from './settings.routes.js'" },
            { old: "import shopRoutes from './shopRoutes.js'", new: "import shop from './shop.routes.js'" },
            { old: "import branchRoutes from './branchRoutes.js'", new: "import branch from './branch.routes.js'" },
            { old: "import subscriptionPlanRoutes from './subscriptionPlanRoutes.js'", new: "import subscriptionPlan from './subscriptionPlan.routes.js'" },
            { old: "import auditLogRoutes from './auditLogRoutes.js'", new: "import auditLog from './auditLog.routes.js'" },
            { old: "import adminRoutes from './adminRoutes.js'", new: "import admin from './admin.routes.js'" },
            // Update usage
            { old: /\bauthRoutes\b/g, new: 'auth' },
            { old: /\buserRoutes\b/g, new: 'user' },
            { old: /\bbusinessRoutes\b/g, new: 'business' },
            { old: /\bhealthRoutes\b/g, new: 'health' },
            { old: /\brefreshTokenRoutes\b/g, new: 'refreshToken' },
            { old: /\breportRoutes\b/g, new: 'report' },
            { old: /\bsettingsRoutes\b/g, new: 'settings' },
            { old: /\bshopRoutes\b/g, new: 'shop' },
            { old: /\bbranchRoutes\b/g, new: 'branch' },
            { old: /\bsubscriptionPlanRoutes\b/g, new: 'subscriptionPlan' },
            { old: /\bauditLogRoutes\b/g, new: 'auditLog' },
            { old: /\badminRoutes\b/g, new: 'admin' }
        ]
    },
    {
        file: 'backend/src/modules/crm/routes/crm.routes.ts',
        replacements: [
            { old: "import customerRoutes from './customerRoutes.js'", new: "import customer from './customer.routes.js'" },
            { old: "import supplierRoutes from './supplierRoutes.js'", new: "import supplier from './supplier.routes.js'" },
            { old: "import whatsappRoutes from './whatsappRoutes.js'", new: "import whatsapp from './whatsapp.routes.js'" },
            { old: /\bcustomerRoutes\b/g, new: 'customer' },
            { old: /\bsupplierRoutes\b/g, new: 'supplier' },
            { old: /\bwhatsappRoutes\b/g, new: 'whatsapp' }
        ]
    },
    {
        file: 'backend/src/modules/finance/routes/finance.routes.ts',
        replacements: [
            { old: "import billRoutes from './billRoutes.js'", new: "import bill from './bill.routes.js'" },
            { old: "import cashBankRoutes from './cashBankRoutes.js'", new: "import cashBank from './cashBank.routes.js'" },
            { old: "import dueRoutes from './dueRoutes.js'", new: "import due from './due.routes.js'" },
            { old: "import loyaltyRoutes from './loyaltyRoutes.js'", new: "import loyalty from './loyalty.routes.js'" },
            { old: "import dayEndRoutes from './dayEndRoutes.js'", new: "import dayEnd from './dayEnd.routes.js'" },
            { old: "import pettyCashRoutes from './pettyCashRoutes.js'", new: "import pettyCash from './pettyCash.routes.js'" },
            { old: "import bankStatementRoutes from './bankStatementRoutes.js'", new: "import bankStatement from './bankStatement.routes.js'" },
            { old: "import loanRoutes from './loanRoutes.js'", new: "import loan from './loan.routes.js'" },
            { old: "import dailyFinanceRoutes from './dailyFinanceRoutes.js'", new: "import dailyFinance from './dailyFinance.routes.js'" },
            { old: "import journalEntryRoutes from './journalEntryRoutes.js'", new: "import journalEntry from './journalEntry.routes.js'" },
            { old: "import clearingParameterRoutes from './clearingParameterRoutes.js'", new: "import clearingParameter from './clearingParameter.routes.js'" },
            { old: /\bbillRoutes\b/g, new: 'bill' },
            { old: /\bcashBankRoutes\b/g, new: 'cashBank' },
            { old: /\bdueRoutes\b/g, new: 'due' },
            { old: /\bloyaltyRoutes\b/g, new: 'loyalty' },
            { old: /\bdayEndRoutes\b/g, new: 'dayEnd' },
            { old: /\bpettyCashRoutes\b/g, new: 'pettyCash' },
            { old: /\bbankStatementRoutes\b/g, new: 'bankStatement' },
            { old: /\bloanRoutes\b/g, new: 'loan' },
            { old: /\bdailyFinanceRoutes\b/g, new: 'dailyFinance' },
            { old: /\bjournalEntryRoutes\b/g, new: 'journalEntry' },
            { old: /\bclearingParameterRoutes\b/g, new: 'clearingParameter' }
        ]
    },
    {
        file: 'backend/src/modules/hr/routes/hr.routes.ts',
        replacements: [
            { old: "import employeeRoutes from './employeeRoutes.js'", new: "import employee from './employee.routes.js'" },
            { old: "import payrollRoutes from './payrollRoutes.js'", new: "import payroll from './payroll.routes.js'" },
            { old: "import advanceRoutes from './advanceRoutes.js'", new: "import advance from './advance.routes.js'" },
            { old: "import attendanceRoutes from './attendanceRoutes.js'", new: "import attendance from './attendance.routes.js'" },
            { old: /\bemployeeRoutes\b/g, new: 'employee' },
            { old: /\bpayrollRoutes\b/g, new: 'payroll' },
            { old: /\badvanceRoutes\b/g, new: 'advance' },
            { old: /\battendanceRoutes\b/g, new: 'attendance' }
        ]
    }
];

function main() {
    console.log('\n🔄 Updating aggregator import statements...\n');
    
    let totalUpdates = 0;
    
    for (const update of updates) {
        const filePath = path.join(__dirname, '../', update.file.replace('backend/src/modules/', ''));
        
        if (!fs.existsSync(filePath)) {
            console.log(`⏭️  Skipping ${update.file} (path: ${filePath})`);
            continue;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        const original = content;
        
        for (const replacement of update.replacements) {
            if (typeof replacement.old === 'string') {
                if (content.includes(replacement.old)) {
                    content = content.replace(replacement.old, replacement.new);
                    totalUpdates++;
                }
            } else {
                // RegExp replacement
                content = content.replace(replacement.old, replacement.new);
            }
        }
        
        if (original !== content) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Updated: ${path.basename(filePath)}`);
        }
    }
    
    console.log(`\n✅ Completed ${totalUpdates} import updates\n`);
    console.log('✨ All aggregator files updated!\n');
}

main();
