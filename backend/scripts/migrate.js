// Run this script to fix your database
// Save as: backend/scripts/migrate.js
// Run with: node backend/scripts/migrate.js

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const runMigration = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;

    // Step 1: Drop old indexes
    console.log("\n📋 Dropping old indexes...");

    try {
      await db.collection("customers").dropIndex("phone_1");
      console.log("✅ Dropped old 'phone_1' index from customers");
    } catch (err) {
      console.log("⚠️  No old phone index to drop (this is fine)");
    }

    try {
      await db.collection("items").dropIndex("name_1");
      console.log("✅ Dropped old 'name_1' index from items");
    } catch (err) {
      console.log("⚠️  No old name index to drop (this is fine)");
    }

    try {
      await db.collection("items").dropIndex("sku_1");
      console.log("✅ Dropped old 'sku_1' index from items");
    } catch (err) {
      console.log("⚠️  No old sku index to drop (this is fine)");
    }

    // Step 2: Get first user ID (for migration)
    console.log("\n👤 Finding first user for data migration...");
    const firstUser = await db.collection("users").findOne({});

    if (!firstUser) {
      console.log(
        "❌ No users found! Please register at least one user first."
      );
      process.exit(1);
    }

    console.log(`✅ Found user: ${firstUser.name} (${firstUser.email})`);

    // Step 3: Update customers without owner
    console.log("\n👥 Migrating customers...");
    const customerResult = await db
      .collection("customers")
      .updateMany(
        { owner: { $exists: false } },
        { $set: { owner: firstUser._id } }
      );
    console.log(`✅ Updated ${customerResult.modifiedCount} customers`);

    // Step 4: Update items without addedBy (should already have it, but just in case)
    console.log("\n📦 Checking items...");
    const itemResult = await db
      .collection("items")
      .updateMany(
        { addedBy: { $exists: false } },
        { $set: { addedBy: firstUser._id } }
      );
    console.log(`✅ Updated ${itemResult.modifiedCount} items`);

    // Step 5: Create new compound indexes
    console.log("\n🔧 Creating new compound indexes...");

    await db
      .collection("customers")
      .createIndex({ phone: 1, owner: 1 }, { unique: true });
    console.log("✅ Created compound index (phone, owner) on customers");

    await db
      .collection("items")
      .createIndex({ name: 1, addedBy: 1 }, { unique: true });
    console.log("✅ Created compound index (name, addedBy) on items");

    // Step 6: Initialize businessType for BusinessProfiles
    console.log("\n🏢 Initializing businessType for BusinessProfiles...");
    const profileResult = await db
      .collection("businessprofiles")
      .updateMany(
        { businessType: { $exists: false } },
        { $set: { businessType: "" } }
      );
    console.log(`✅ Updated ${profileResult.modifiedCount} business profiles with default businessType`);

    // Step 7: Seed Sectors
    console.log("\n🌱 Seeding Sectors...");
    const sectors = [
      "Stationery",
      "Grocery",
      "Electronics",
      "Pharmacy",
      "Textile",
      "Restaurant",
      "Healthcare"
    ];

    const sectorCollection = db.collection("sectors");
    let sectorCount = 0;

    for (const sectorName of sectors) {
      // Upsert sector
      const result = await sectorCollection.updateOne(
        { name: sectorName },
        {
          $set: {
            name: sectorName,
            isActive: true,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
      if (result.upsertedCount > 0) sectorCount++;
    }
    console.log(`✅ Seeded ${sectorCount} new sectors`);

    // Step 8: Create Employee Indexes
    console.log("\n👷 Creating Employee indexes...");
    await db
      .collection("employees")
      .createIndex({ tenantId: 1, mobile: 1 }, { unique: true });
    console.log("✅ Created compound index (tenantId, mobile) on employees");

    console.log("\n🎉 Migration completed successfully!");
    console.log(
      "\n⚠️  IMPORTANT: If you have duplicate phone numbers or item names,"
    );
    console.log("   you may need to manually clean up your data.");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  }
};

runMigration();
