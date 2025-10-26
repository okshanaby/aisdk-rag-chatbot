import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({
  path: ".env.local",
});
console.log("🚀 ~ process.env.NEON_DATABASE_URL:", process.env.NEON_DATABASE_URL)

export default defineConfig({
  schema: "./lib/db-schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL!,
  },
});
