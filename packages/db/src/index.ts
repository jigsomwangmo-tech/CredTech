import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/ndi_credentials";

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema, casing: "snake_case" });
export * from "./schema";
