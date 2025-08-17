import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

import { env } from "@/lib/env";

const connectionString = env.POSTGRES_URL;

// Optimized connection pooling configuration
const sql = postgres(connectionString, {
  max: env.NODE_ENV === "production" ? 20 : 10, // Increased pool size
  idle_timeout: 20,
  connect_timeout: 60,
  ssl: env.NODE_ENV === "production" ? "require" : undefined,
});

export const db = drizzle(sql, { schema });

export type Database = typeof db;
