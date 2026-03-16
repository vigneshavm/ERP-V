var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { singleton } from "tsyringe";
import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
const configSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.string().transform(Number).default("5000"),
    MONGO_URI: z.string().url(),
    JWT_SECRET: z.string().min(32),
    COOKIE_SECRET: z.string().min(32),
    REDIS_URL: z.string().url().optional(),
    SENTRY_DSN: z.string().url().optional(),
});
let ConfigService = class ConfigService {
    config;
    constructor() {
        // Load .env from the root of the project
        const envPath = path.resolve(process.cwd(), "../../.env");
        dotenv.config({ path: envPath });
        const result = configSchema.safeParse(process.env);
        if (!result.success) {
            console.error("❌ Invalid environment variables:", result.error.format());
            process.exit(1);
        }
        this.config = result.data;
    }
    get(key) {
        return this.config[key];
    }
    get isDevelopment() {
        return this.config.NODE_ENV === "development";
    }
    get isProduction() {
        return this.config.NODE_ENV === "production";
    }
    get isTest() {
        return this.config.NODE_ENV === "test";
    }
};
ConfigService = __decorate([
    singleton(),
    __metadata("design:paramtypes", [])
], ConfigService);
export { ConfigService };
