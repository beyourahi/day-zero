import type { HandleClientError } from "@sveltejs/kit";

/**
 * Client-side error hook. Generates a UUID correlation id, logs the error to the
 * browser console under that id, and returns a sanitized App.Error to the +error page.
 * INVARIANT: 5xx messages are replaced with a generic string so internals never leak to
 * the UI; <500 messages pass through. The returned errorId mirrors the same id logged,
 * so users can quote it for support correlation. @see hooks.server.ts handleError.
 */
export const handleError: HandleClientError = async ({ error, status, message }) => {
	const errorId = crypto.randomUUID();

	console.error(`[${errorId}] Client error:`, {
		status,
		message,
		error: error instanceof Error ? { name: error.name, message: error.message } : error
	});

	return {
		message: status >= 500 ? "An unexpected error occurred" : message,
		errorId
	};
};
