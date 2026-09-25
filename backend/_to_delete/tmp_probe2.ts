console.log("START");
import dotenv from "dotenv";
dotenv.config();
console.log("ENV LOADED", process.env.TEXTILESOFT_DB_HOST || process.env.SHOP_DB_HOST || "no host env seen");
