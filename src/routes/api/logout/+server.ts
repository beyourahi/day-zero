import { json, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// Logout. Both verbs clear the Better Auth session cookie. Better Auth names it
// `${cookiePrefix}.session_token`; because `useSecureCookies: true` is set in auth.ts, the name is
// additionally `__Secure-`-prefixed in every environment, so the live cookie is
// `__Secure-day-zero.session_token`. We clear both the secure-prefixed and bare names (a delete of a
// non-existent cookie is a no-op) so the session is terminated regardless of the secure-cookie
// nuance. POST returns JSON { success: true } (fetch-based sign-out); GET 303-redirects to /login
// (plain anchor navigation).
export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete("__Secure-day-zero.session_token", { path: "/", secure: true });
	cookies.delete("day-zero.session_token", { path: "/" });
	return json({ success: true });
};

export const GET: RequestHandler = async ({ cookies }) => {
	cookies.delete("__Secure-day-zero.session_token", { path: "/", secure: true });
	cookies.delete("day-zero.session_token", { path: "/" });
	redirect(303, "/login");
};
