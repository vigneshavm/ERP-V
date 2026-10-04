import app from "./app.js";
import http from "http";
import logger from "./config/logger.js";
import dotenv from "dotenv";
import path from "path";
import { validateEnv } from "./config/validateEnv.js";
import { verifyEmailTransport } from "./utils/emailService.js";
import { logSqlAuthSetup } from "./integrations/textilesoft/sqlAuth.js";
import { logDuplicateProductCodes } from "./integrations/textilesoft/sqlProducts.js";
import { logPurchaseNumberClashes } from "./integrations/textilesoft/sqlPurchase.js";
import {
  adminConfigured,
  ensureErpDbAccess,
} from "./integrations/textilesoft/sqlDbAccess.js";

// robust .env loading
const result = dotenv.config({ path: path.resolve(process.cwd(), ".env") });
if (result.error) {
  dotenv.config(); // fallback
}

// Environment Validation
validateEnv();

// Item/stock reads use Textilesoft SQL Server.
logger.info("📦 Item data source: SQL");

const PORT = process.env.PORT || 5000;

// Email Transport Verification
verifyEmailTransport().catch((err) => {
  logger.error("Email transport verification error:", err);
});

logger.info("Application database mode: SQL only");

const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info("🔐 Login source: Textilesoft SQL users");
  void logSqlAuthSetup();
  // Product codes taken twice (Textilesoft desktop + ERP adding a product at the same moment).
  void logDuplicateProductCodes();
  // Barcodes / GRN numbers taken twice (same race, on purchases).
  void logPurchaseNumberClashes();
  // Keep the ERP logins' grants on the shop database current (new write tables, or after a restore).
  if (adminConfigured()) {
    ensureErpDbAccess().catch((err) =>
      logger.warn(
        `[sql-access] startup grant check skipped - ${(err as Error).message}`,
      ),
    );
  }
});

server.on("error", (error: any) => {
  if (error.code === "EADDRINUSE") {
    logger.error(
      `❌ Port ${PORT} is already in use. Please kill the process using it.`,
    );
    process.exit(1);
  }
});

// Graceful Shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (err: Error) => {
  logger.error(`UNHANDLED REJECTION! 💥`, {
    error: err.message,
    stack: err.stack,
  });
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err: Error) => {
  logger.error(`UNCAUGHT EXCEPTION! 💥`, {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});
