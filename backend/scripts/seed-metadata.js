import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import models
import Sector from "../src/modules/core/models/Sector.js";
import BusinessType from "../src/modules/core/models/BusinessType.js";

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

const sectors = [
    { name: "Textile" },
    { name: "Electronics" },
    { name: "Grocery" },
    { name: "Pharmacy" },
    { name: "Automobile" },
    { name: "Fashion" },
    { name: "FMCG" },
    { name: "Hardware" },
    { name: "Furniture" },
    { name: "Jewellery" }
];

const businessTypes = [
    { name: "Retail", slug: "retail" },
    { name: "Wholesale", slug: "wholesale" },
    { name: "Distributor", slug: "distributor" },
    { name: "Service", slug: "service" },
    { name: "Manufacturing", slug: "manufacturing" }
];

const seedMetadata = async () => {
    try {
        await connectDB();

        console.log("🌱 Seeding Sectors...");
        for (const s of sectors) {
            await Sector.findOneAndUpdate(
                { name: s.name },
                { $set: s },
                { upsert: true, new: true }
            );
        }
        console.log("✅ Sectors seeded.");

        console.log("🌱 Seeding Business Types...");
        for (const bt of businessTypes) {
            await BusinessType.findOneAndUpdate(
                { slug: bt.slug },
                { $set: bt },
                { upsert: true, new: true }
            );
        }
        console.log("✅ Business Types seeded.");

        console.log("✨ Metadata seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedMetadata();
