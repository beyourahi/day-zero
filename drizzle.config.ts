// Drizzle Kit config for the Cloudflare D1 (SQLite) schema in src/lib/server/schema.ts;
// migrations emit to ./migrations. The remote d1-http driver is selected only when all
// three CLOUDFLARE_* env vars are present; otherwise the credential-free base config is
// used, so schema-only / local commands work without remote D1 access.
import { defineConfig } from "drizzle-kit";

const hasD1Credentials =
	process.env.CLOUDFLARE_ACCOUNT_ID &&
	process.env.CLOUDFLARE_DATABASE_ID &&
	process.env.CLOUDFLARE_D1_TOKEN;

const baseConfig = {
	out: "./migrations",
	schema: "./src/lib/server/schema.ts",
	dialect: "sqlite" as const,
	verbose: true,
	strict: true,
	breakpoints: true
};

export default defineConfig(
	hasD1Credentials
		? {
				...baseConfig,
				driver: "d1-http",
				dbCredentials: {
					accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
					databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
					token: process.env.CLOUDFLARE_D1_TOKEN!
				}
			}
		: baseConfig
);
