import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Schemas
const TenantSchema = new mongoose.Schema({ slug: String });
const EmployeeSchema = new mongoose.Schema({ tenantId: mongoose.Schema.Types.ObjectId, name: String, isActive: Boolean });
const SalaryComponentSchema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    name: String
    // other fields ignored for this lookup
});

const SalaryStructureSchema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    employeeId: mongoose.Schema.Types.ObjectId,
    components: [{
        componentId: mongoose.Schema.Types.ObjectId,
        amount: Number
    }],
    isActive: Boolean
});

// Models
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);
const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
const SalaryComponent = mongoose.models.SalaryComponent || mongoose.model('SalaryComponent', SalaryComponentSchema);
const SalaryStructure = mongoose.models.SalaryStructure || mongoose.model('SalaryStructure', SalaryStructureSchema);

const main = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not found");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const tenantSlug = 'vijaya-laxmi';
        const tenant = await Tenant.findOne({ slug: tenantSlug });
        if (!tenant) throw new Error(`Tenant '${tenantSlug}' not found!`);

        // 1. Find Tea Allowance Component Configuration
        const teaComp = await SalaryComponent.findOne({ tenantId: tenant._id, name: 'Tea Allowance' });
        if (!teaComp) throw new Error("Tea Allowance component not found! Please run add_tea_allowance.js first.");

        console.log(`Using Component: ${teaComp.name} (${teaComp._id})`);

        // 2. Find All Active Employees
        const employees = await Employee.find({ tenantId: tenant._id, isActive: true });
        console.log(`Found ${employees.length} active employees.`);

        let updatedCount = 0;

        // 3. Update Structures
        for (const emp of employees) {
            let structure = await SalaryStructure.findOne({
                tenantId: tenant._id,
                employeeId: emp._id,
                isActive: true
            });

            if (!structure) {
                console.log(`Creating new Salary Structure for ${emp.name}...`);
                structure = new SalaryStructure({
                    tenantId: tenant._id,
                    employeeId: emp._id,
                    components: [],
                    isActive: true,
                    effectiveFrom: new Date(),
                    grossSalary: 0,
                    netSalaryEstimate: 0
                });
            }

            // Check if already has Tea Allowance
            const hasTea = structure.components.some((c) => c.componentId.toString() === teaComp._id.toString());

            if (!hasTea) {
                // Add Tea Allowance (Default 15)
                structure.components.push({
                    componentId: teaComp._id,
                    amount: 15
                });
                await structure.save();
                console.log(`Updated ${emp.name}: Added Tea Allowance (15).`);
                updatedCount++;
            } else {
                console.log(`Skipping ${emp.name}: Already has Tea Allowance.`);
            }
        }

        console.log(`\nOperation Complete. Updated ${updatedCount} employees.`);
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

main();
