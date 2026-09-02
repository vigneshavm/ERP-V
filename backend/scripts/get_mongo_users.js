import mongoose from 'mongoose';

const MONGO_URI = "mongodb+srv://avmvignesh0207_db_user:ZCckCkmL9wRzKHfW@cluster0.kxzqtht.mongodb.net/bizzai";

async function getUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.');

        const db = mongoose.connection.db;
        const users = await db.collection('users').find({}, { projection: { name: 1, email: 1, role: 1, is_active: 1 } }).toArray();

        console.log('\n========================================');
        console.log('       REGISTERED MONGODB USERS        ');
        console.log('========================================');
        users.forEach((u, i) => {
            console.log(`${i + 1}. Name: ${u.name || u.email}`);
            console.log(`   Email: ${u.email}`);
            console.log(`   Role: ${u.role || 'N/A'}`);
            console.log('----------------------------------------');
        });

    } catch (err) {
        console.error('Error querying users:', err);
    } finally {
        await mongoose.disconnect();
    }
}

getUsers();
