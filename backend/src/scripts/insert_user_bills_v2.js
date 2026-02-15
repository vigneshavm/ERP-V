import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

const billSchema = new mongoose.Schema({
    billNo: String,
    vendorInvoiceNo: String,
    tenantId: String,
    date: Date,
    supplier: mongoose.Types.ObjectId,
    amount: Number,
    items: [{
        productId: mongoose.Types.ObjectId,
        name: String,
        quantity: Number,
        rate: Number,
        taxRate: Number,
        taxAmount: Number,
        total: Number,
    }],
    subTotal: Number,
    paidAmount: Number,
    status: String,
    paymentStatus: String,
    createdBy: mongoose.Types.ObjectId
}, { collection: 'bills', timestamps: true });

const supplierSchema = new mongoose.Schema({
    businessName: String,
    supplierId: String,
    contactNo: String,
    email: String,
    tenantId: mongoose.Schema.Types.Mixed,
    owner: mongoose.Schema.Types.ObjectId,
    createdBy: mongoose.Schema.Types.ObjectId,
    status: String
}, { collection: 'suppliers' });

const itemSchema = new mongoose.Schema({
    name: String,
    costPrice: Number,
    sellingPrice: Number,
    stockQty: Number,
    addedBy: String,
    tenantId: mongoose.Schema.Types.Mixed
}, { collection: 'items' });

const Bill = mongoose.model('Bill', billSchema);
const Supplier = mongoose.model('Supplier', supplierSchema);
const Item = mongoose.model('Item', itemSchema);

async function run() {
    try {
        console.log("Connecting to MongoDB (Forcing Google DNS)...");
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 60000,
            connectTimeoutMS: 60000
        });
        console.log("✅ Connected to MongoDB");

        const templateSupplier = await Supplier.findOne({ businessName: "Zara" }) || await Supplier.findOne({});
        if (!templateSupplier) throw new Error("No suppliers found to use as template");

        const tenantId = templateSupplier.tenantId;
        const ownerId = templateSupplier.owner;
        const createdById = templateSupplier.createdBy || ownerId;

        let dummyItem = await Item.findOne({ name: "General Fabric", tenantId });
        if (!dummyItem) {
            dummyItem = await Item.create({
                name: "General Fabric",
                costPrice: 0,
                sellingPrice: 0,
                stockQty: 0,
                addedBy: createdById.toString(),
                tenantId: tenantId
            });
        }

        const data = [
            { date: '2026-01-28', description: 'Jeyaram Agency', billNo: '22914', amount: 161739 },
            { date: '2026-01-26', description: 'R.G. Trendz', billNo: '424', amount: 29447 },
            { date: '2026-01-24', description: 'GL Fashions', billNo: 'GLF-001', amount: 40156 },
            { date: '2026-01-24', description: 'E.G. Subbiah Dresses', billNo: '433', amount: 27221 },
            { date: '2026-01-27', description: 'E.G. Subbiah Dresses', billNo: '435', amount: 22418 },
            { date: '2026-01-27', description: 'E.G. Subbiah Dresses', billNo: '437', amount: 36226 },
            { date: '2026-01-26', description: 'Mahesh & Co', billNo: '474', amount: 26460 },
            { date: '2026-01-26', description: 'B & B Textile', billNo: '67213', amount: 5906 },
            { date: '2026-01-11', description: 'Aatarsh Clothing Company', billNo: '11464', amount: 58958 },
            { date: '2026-01-07', description: 'A.R.G Garments', billNo: '1261', amount: 31563 },
            { date: '2026-01-01', description: 'A. Arumuga Mudaliar & Sons', billNo: '780', amount: 14860 },
            { date: '2026-01-01', description: 'Jeyaram Agency', billNo: '23026', amount: 7049 },
            { date: '2026-01-01', description: 'Jeyaram Agency', billNo: '23049', amount: 10779 },
            { date: '2026-01-01', description: 'Jeyaram Agency', billNo: '22935', amount: 12209 },
            { date: '2026-01-01', description: 'SPE Fashion', billNo: '468', amount: 29247 },
            { date: '2026-01-01', description: 'Viver Enterprise', billNo: '477', amount: 35981 },
            { date: '2026-01-01', description: 'A. Arumuga Mudaliar & Sons', billNo: '796', amount: 30475 }
        ];

        const supplierAliases = {
            "Jeyaram Agency": "Jayaram Agency",
            "E.G. Subbiah Dresses": "E. G. Subbish dresses",
            "A. Arumuga Mudaliar & Sons": "A. Arumuga Mudalias & sons",
            "A.R.G Garments": "A. R.Garments"
        };

        for (let i = 0; i < data.length; i++) {
            const entry = data[i];
            const bizName = supplierAliases[entry.description] || entry.description;
            let supplier = await Supplier.findOne({ businessName: new RegExp(`^${bizName}$`, 'i') });

            if (!supplier) {
                const dummyPhone = `82222222${i.toString().padStart(2, '0')}`;
                const dummyEmail = `supplier_${i}_${Date.now()}@test.com`;
                supplier = await Supplier.create({
                    businessName: bizName,
                    supplierId: `SUP-${Date.now()}-${i}`,
                    contactNo: dummyPhone,
                    email: dummyEmail,
                    tenantId,
                    owner: ownerId,
                    createdBy: createdById,
                    status: 'active'
                });
            }

            const billNo = `${entry.billNo || 'NB'}-${i + 1}-${Date.now().toString().slice(-4)}`;

            await Bill.create({
                billNo: billNo,
                vendorInvoiceNo: entry.billNo,
                tenantId,
                date: new Date(entry.date),
                supplier: supplier._id,
                amount: entry.amount,
                subTotal: entry.amount,
                paidAmount: 0,
                status: 'unpaid',
                paymentStatus: 'unpaid',
                createdBy: createdById,
                items: [{
                    productId: dummyItem._id,
                    name: "General Fabric",
                    quantity: 1,
                    rate: entry.amount,
                    taxRate: 0,
                    taxAmount: 0,
                    total: entry.amount
                }]
            });
            console.log(`✅ [${i + 1}/17] Created bill for ${bizName}`);
        }

        console.log("✅ All bills inserted successfully.");
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

run();
