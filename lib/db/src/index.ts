import dns from "node:dns";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let connectionString = process.env.DATABASE_URL_SUPABASE || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or DATABASE_URL_SUPABASE must be set. Did you forget to provision a database?",
  );
}

// Dynamically resolve hostname to IPv4 to prevent IPv6 connectivity errors (ENETUNREACH)
try {
  const url = new URL(connectionString);
  if (url.hostname && !url.hostname.startsWith("[")) {
    console.log(`[DB INIT] Resolving DNS for host: ${url.hostname}`);
    const dnsResult = await dns.promises.lookup(url.hostname, { family: 4 });
    console.log(`[DB INIT] Resolved ${url.hostname} to IPv4: ${dnsResult.address}`);
    url.hostname = dnsResult.address;
    connectionString = url.toString();
  }
} catch (error) {
  console.error("[DB INIT] DNS resolution fallback failed or host is invalid URL:", error);
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
  ssl:
    connectionString.includes("supabase.co") ||
    connectionString.includes("supabase.com") ||
    connectionString.includes("supabase")
      ? { rejectUnauthorized: false }
      : undefined,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
