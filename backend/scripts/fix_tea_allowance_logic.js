import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const salaryComponentSchema = new mongoose.Schema({
    tenantId: mongoose.Schema.Types.ObjectId,
    name: String,
    type: String,
    calculationType: String,
    defaultValue: Number
});

const SalaryComponent = mongoose.models.SalaryComponent || mongoose.model('SalaryComponent', salaryComponentSchema);

const main = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const result = await SalaryComponent.updateMany(
            { name: 'Tea Allowance' },
            {
                $set: {
                    calculationType: 'PERCENTAGE',
                    defaultValue: 15
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} Tea Allowance components to PERCENTAGE (15%)`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

main();
