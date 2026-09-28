import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

/**
 * Real MongoDB for repository tests (tenant isolation etc). A single-node replica set, so code
 * that opens transactions works too. The mongod binary is downloaded once and cached by
 * mongodb-memory-server; that download needs access to fastdl.mongodb.org.
 */
let replSet: MongoMemoryReplSet | undefined;

export const startMongo = async (): Promise<void> => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(replSet.getUri());
};

export const clearMongo = async (): Promise<void> => {
    const { collections } = mongoose.connection;
    await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
};

export const stopMongo = async (): Promise<void> => {
    await mongoose.disconnect();
    await replSet?.stop();
};
