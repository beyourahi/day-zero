/**
 * Typed fetch wrapper for the app's REST API plus two persistence helpers.
 *  - api.*: throw on non-2xx (message = response body or status line); 204 and
 *    non-JSON 200 resolve to undefined.
 *  - sync(fn): swallow + log errors, returning T | null — used for fire-and-go
 *    mutations whose failure is handled by store-level rollback, not a throw.
 *  - debounceSync(key, ms, fn): keyed, trailing-edge debounced fire-and-forget
 *    for high-frequency text-field saves; a newer call for the same key cancels
 *    the pending one. Errors are logged, never surfaced.
 */
type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

const send = async <T>(method: Method, path: string, body?: unknown): Promise<T> => {
	const res = await fetch(path, {
		method,
		headers: body !== undefined ? { "content-type": "application/json" } : undefined,
		body: body !== undefined ? JSON.stringify(body) : undefined
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(text || `${method} ${path} failed with ${res.status}`);
	}
	if (res.status === 204) return undefined as T;
	const ct = res.headers.get("content-type") ?? "";
	return ct.includes("application/json") ? ((await res.json()) as T) : (undefined as T);
};

export const api = {
	get: <T>(path: string) => send<T>("GET", path),
	post: <T>(path: string, body?: unknown) => send<T>("POST", path, body),
	patch: <T>(path: string, body?: unknown) => send<T>("PATCH", path, body),
	put: <T>(path: string, body?: unknown) => send<T>("PUT", path, body),
	delete: <T>(path: string) => send<T>("DELETE", path)
};

const pending = new Map<string, ReturnType<typeof setTimeout>>();

export const debounceSync = <T>(key: string, delayMs: number, fn: () => Promise<T>): void => {
	const existing = pending.get(key);
	if (existing) clearTimeout(existing);
	const timer = setTimeout(async () => {
		pending.delete(key);
		try {
			await fn();
		} catch (err) {
			console.error("[sync]", key, err);
		}
	}, delayMs);
	pending.set(key, timer);
};

export const sync = async <T>(fn: () => Promise<T>): Promise<T | null> => {
	try {
		return await fn();
	} catch (err) {
		console.error("[sync]", err);
		return null;
	}
};
