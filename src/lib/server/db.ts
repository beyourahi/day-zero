/**
 * Per-request Drizzle factory over the D1 binding. Call once per request (Workers has no
 * shared module state). The exported `Database` type is the parameter type used by every
 * repository function.
 */
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Database = ReturnType<typeof getDatabase>;

export const getDatabase = (d1: D1Database) => drizzle(d1, { schema });

export { schema };
