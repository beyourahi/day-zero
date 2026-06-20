/**
 * Better Auth factory, instantiated PER REQUEST in hooks.server.ts (Workers has no
 * long-lived module state; the D1 binding arrives per request).
 * INVARIANT: Google OAuth is the ONLY sign-in method — emailAndPassword is intentionally
 * disabled; do not enable it. usePlural matches the snake_case plural table names in schema.ts.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

interface AuthEnv {
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
}

export const createAuth = (d1: D1Database, env: AuthEnv) => {
	const db = drizzle(d1, { schema });

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "sqlite",
			usePlural: true,
			schema
		}),
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		emailAndPassword: {
			enabled: false
		},
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET
			}
		},
		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
			// 5-minute signed cookie cache avoids a DB read on every request; sessions
			// resolve from the cookie until maxAge elapses, then re-hit D1.
			cookieCache: {
				enabled: true,
				maxAge: 60 * 5,
				version: "1"
			}
		},
		// Rate limit state lives in the rate_limits table (schema.ts), not memory — required
		// because Workers isolates do not share in-process state across requests.
		rateLimit: {
			enabled: true,
			window: 60,
			max: 20,
			storage: "database"
		},
		advanced: {
			cookiePrefix: "day-zero",
			useSecureCookies: true
		},
		// OAuth callbacks/CSRF are rejected from origins not listed here; the two localhost
		// ports cover Vite dev (5173) and Wrangler preview (8787), plus the branded prod domain.
		trustedOrigins: [
			"http://localhost:5173",
			"http://localhost:8787",
			"https://day-zero.dropoutstudio.co"
		]
	});
};

export type Auth = ReturnType<typeof createAuth>;
