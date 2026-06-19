import { json, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// Logout. Both verbs delete the Better Auth session cookie (`invoice-generator.session_token`).
// POST returns JSON { success: true } (for fetch-based sign-out); GET 303-redirects to /login
// (for plain anchor navigation). Cookie name must match the Better Auth config.
export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete("invoice-generator.session_token", { path: "/" });
	return json({ success: true });
};

export const GET: RequestHandler = async ({ cookies }) => {
	cookies.delete("invoice-generator.session_token", { path: "/" });
	redirect(303, "/login");
};
