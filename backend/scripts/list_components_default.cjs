
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const salaryComponentSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['EARNING', 'DEDUCTION'], required: true },
    calculationType: { type: String, enum: ['FLAT', 'PERCENTAGE'], default: 'FLAT' },
    defaultValue: { type: Number, default: 0 },
    isTaxable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Use existing model if already compiled
const SalaryComponent = mongoose.models.SalaryComponent || mongoose.model('SalaryComponent', salaryComponentSchema);

const checkComponents = async () => {
    await connectDB();

    const tenantId = '69761b0971da0390f468f318'; // Default Organization

    console.log(`Checking components for Tenant: ${tenantId}`);

    const components = await SalaryComponent.find({ tenantId });

    console.log(`Found ${components.length} components:`);
    components.forEach(c => {
        console.log(`- [${c.isActive ? 'ACTIVE' : 'INACTIVE'}] ${c.name} (${c.type}) - Default: ${c.defaultValue} - ID: ${c._id}`);
    });

    process.exit();
};

checkComponents();
