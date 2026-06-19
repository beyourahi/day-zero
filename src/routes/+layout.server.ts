import type { LayoutServerLoad } from "./$types";

/**
 * Root layout load. Surfaces the auth identity populated by `hooks.server.ts`
 * (`locals.user/session/currentUser`) into every page's data, plus the AI Copilot
 * feature flag (`aiEnabled`, from AI_COPILOT_ENABLED !== "false") used by the layout
 * to gate the copilot mount.
 */
export const load: LayoutServerLoad = async ({ locals, platform }) => {
	return {
		user: locals.user,
		session: locals.session,
		currentUser: locals.currentUser,
		aiEnabled: platform?.env?.AI_COPILOT_ENABLED !== "false"
	};
};
