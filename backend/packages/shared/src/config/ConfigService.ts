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

type Config = z.infer<typeof configSchema>;

@singleton()
export class ConfigService {
  private readonly config: Config;

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

  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  get isDevelopment(): boolean {
    return this.config.NODE_ENV === "development";
  }

  get isProduction(): boolean {
    return this.config.NODE_ENV === "production";
  }

  get isTest(): boolean {
    return this.config.NODE_ENV === "test";
  }
}
