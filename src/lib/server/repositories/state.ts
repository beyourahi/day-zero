/**
 * Aggregates the full per-user AppState. Consumed by +page.server.ts to hydrate
 * the countdowns store on page load.
 */
import type { Database } from "../db";
import { listByUser } from "./countdowns";
import type { AppState } from "../dto";

export const loadAppState = async (db: Database, userId: string): Promise<AppState> => {
	const countdowns = await listByUser(db, userId);
	return { countdowns };
};
