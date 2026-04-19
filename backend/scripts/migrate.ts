import { connectDB, disconnectDB } from "./utils/db.js";
import mongoose from "mongoose";

const runMigration = async () => {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not established");

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
      return;
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

    // Step 4: Update items without addedBy
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

  } catch (error: any) {
    console.error("\n❌ Migration failed:", error.message);
  } finally {
    await disconnectDB();
  }
};

runMigration();
