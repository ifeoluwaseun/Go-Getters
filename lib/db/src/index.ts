import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL_SUPABASE || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or DATABASE_URL_SUPABASE must be set. Did you forget to provision a database?",
  );
}

try {
  const urlParts = connectionString.split("@")[1] || connectionString;
  const hostAndDb = urlParts.split("?")[0];
  console.log(`[DB INIT] Connecting to database at: ${hostAndDb}`);
} catch (e) {
  console.log("[DB INIT] Connecting to database...");
}

export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
