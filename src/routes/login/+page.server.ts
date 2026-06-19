import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

// Login page guard: 303-redirect to / if already authenticated, else render the page.
export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(303, "/");
	}

	return {};
};
