import type { LayoutServerLoad } from "./$types";

/**
 * Root layout load. Surfaces the client-safe auth identity populated by `hooks.server.ts`
 * (`locals.user`/`currentUser`) into every page's data, plus the AI Copilot feature flag
 * (`aiEnabled`, from AI_COPILOT_ENABLED !== "false") used by the layout to gate the copilot mount.
 * `locals.session` is intentionally NOT returned: it carries the session token, which must never be
 * serialized into the page hydration payload — the token belongs only in the httpOnly cookie.
 */
export const load: LayoutServerLoad = async ({ locals, platform }) => {
	return {
		user: locals.user,
		currentUser: locals.currentUser,
		aiEnabled: platform?.env?.AI_COPILOT_ENABLED !== "false"
	};
};
