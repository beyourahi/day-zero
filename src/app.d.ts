/// <reference types="@sveltejs/kit" />
/// <reference types="@cloudflare/workers-types" />

import type { CurrentUser } from "$lib/types";
import type { Auth } from "$lib/server/auth";

/**
 * SvelteKit App namespace augmentation.
 * - Locals: populated per-request by hooks.server.ts (null when unauthenticated/D1 absent).
 * - Platform.env: the Cloudflare Worker bindings (see wrangler.jsonc). Optional members
 *   (AI, AI_QUOTA_KV, AI_*, E2E_BYPASS_AUTH) degrade gracefully when unset; DB is required
 *   at runtime for auth, and AI is required for the Copilot chat turn. NO AI Gateway / RAG /
 *   VECTORIZE — the Copilot calls the Workers AI binding directly.
 * - PageData.aiEnabled: feature flag derived from AI_COPILOT_ENABLED in +layout.server.ts.
 * - Error.errorId: UUID correlation id surfaced by both handleError hooks.
 */
declare global {
	namespace App {
		interface Locals {
			user: Auth["$Infer"]["Session"]["user"] | null;
			session: Auth["$Infer"]["Session"]["session"] | null;
			currentUser: CurrentUser | null;
		}

		interface Platform {
			env: {
				DB: D1Database;
				BETTER_AUTH_SECRET: string;
				BETTER_AUTH_URL: string;
				GOOGLE_CLIENT_ID: string;
				GOOGLE_CLIENT_SECRET: string;
				// AI Copilot bindings. AI is the Workers AI binding (called directly — no
				// AI Gateway, no RAG/VECTORIZE). AI_QUOTA_KV is optional (quota/spend cap
				// degrade gracefully when absent). AI_COPILOT_ENABLED="false" disables the feature.
				AI?: Ai;
				AI_QUOTA_KV?: KVNamespace;
				AI_COPILOT_ENABLED?: string;
				AI_MONTHLY_CAP_USD?: string;
				E2E_BYPASS_AUTH?: string;
			};
			cf: CfProperties;
			ctx: ExecutionContext;
		}

		interface PageData {
			user: Locals["user"];
			currentUser: CurrentUser | null;
			aiEnabled?: boolean;
		}

		interface Error {
			message: string;
			errorId?: string;
		}
	}
}

export {};
