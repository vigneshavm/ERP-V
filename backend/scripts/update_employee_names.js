
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Script started...');
console.log('Current directory:', __dirname);

// Hardcoded URI from comments since .env is missing it
const MONGO_URI = 'mongodb+srv://avmvignesh0207_db_user:XB5qPLz5l08d6FvL@cluster0.kxzqtht.mongodb.net/bizzai';

console.log('Using constructed URI');


// Tenant ID for Vijaya Laxmi - fetched from previous context or we can find it
const TENANT_NAME = 'Vijaya Laxmi';

// South Indian Names
// 10 Female Names
const femaleNames = [
    'Lakshmi Priya',
    'Kavitha',
    'Meenakshi',
    'Divya',
    'Anjali',
    'Revathi',
    'Sangeetha',
    'Bhuvaneswari',
    'Karthika',
    'Mahalakshmi'
];

// 12 Male Names (assuming 22 total)
const maleNames = [
    'Karthik',
    'Saravanan',
    'Muthu Kumar',
    'Senthil',
    'Ramesh',
    'Suresh',
    'Manikandan',
    'Vijay',
    'Ajith',
    'Surya',
    'Dhanush',
    'Vikram'
];

// Generic Schema for Employee update
const employeeSchema = new mongoose.Schema({
    name: String,
    tenantId: mongoose.Schema.Types.ObjectId,
}, { strict: false });

// Only register model if not already registered (though scripts run in isolation usually)
const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

// Schema for Business to find tenant ID
const businessSchema = new mongoose.Schema({
    name: String,
    tenantId: String
}, { strict: false });

const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', businessSchema, 'tenants');

const updatenames = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // List databases
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('Databases:', dbs.databases.map(d => d.name));

        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        // Check for duplicate tenants
        const similarTenants = await Tenant.find({ name: /Vijaya/i });
        console.log('Similar Tenants:', similarTenants.map(t => `${t.name} (${t._id})`));

        // Group employees by tenantId
        const agg = await Employee.aggregate([
            { $group: { _id: "$tenantId", count: { $sum: 1 } } }
        ]);
        console.log('Employee Counts by Tenant:', agg);

        // 1. Find Tenant (Original logic)
        const tenant = await Tenant.findOne({ name: TENANT_NAME });
        // ... (rest of logic)
        if (!tenant) {
            console.error(`Tenant '${TENANT_NAME}' not found.`);
            const allTenants = await Tenant.find({}, 'name tenantId');
            console.log('Available Tenants:', allTenants.map(t => `${t.name} (${t.tenantId})`));
            process.exit(1);
        }
        console.log('Tenant Object:', tenant);
        // Use ObjectId directly
        const tId = tenant._id;
        console.log(`Using Tenant ID: ${tId}`);

        // 2. Fetch All Employees for this Tenant
        const employees = await Employee.find({ tenantId: tId });
        console.log(`Found ${employees.length} employees.`);

        if (employees.length === 0) {
            console.log('No employees found for this tenant.');
            // Debug: find ANY employee
            const anyEmp = await Employee.findOne({});
            console.log('Sample Employee:', anyEmp);
            process.exit(0);
        }

        // 3. Update Names
        // We will iterate and assign names. 
        // Logic: First 10 get female names, rest get male names.

        let femaleIndex = 0;
        let maleIndex = 0;

        for (let i = 0; i < employees.length; i++) {
            const emp = employees[i];
            let newName = '';

            // Assign Female Names first (if available)
            if (femaleIndex < femaleNames.length) {
                newName = femaleNames[femaleIndex];
                femaleIndex++;
            }
            // Then assign Male Names
            else if (maleIndex < maleNames.length) {
                newName = maleNames[maleIndex];
                maleIndex++;
            } else {
                // Fallback if we have more employees than names
                newName = `Staff Member ${i + 1}`;
            }

            // Update
            await Employee.updateOne({ _id: emp._id }, { $set: { name: newName } });
            console.log(`Updated ${emp.name} -> ${newName}`);
        }

        console.log('All employee names updated successfully.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

updatenames();
