import dns from 'dns';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

async function check() {
    info("URI Length:", MONGO_URI?.length);
    if (!MONGO_URI) {
        logError("❌ MONGO_URI not found");
        process.exit(1);
    }

    const host = MONGO_URI.split('@')[1]?.split('/')[0];
    info("Hostname:", host);

    if (host) {
        dns.lookup(host, (err, address, family) => {
            if (err) {
                logError("❌ DNS Lookup Failed:", err.message);
            } else {
                console.log("✅ DNS Lookup Success:", address);
            }
            process.exit(0);
        });
    } else {
        console.error("❌ Could not parse host from URI");
        process.exit(1);
    }
}

check();
