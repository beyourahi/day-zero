/**
 * Countdown board store, synced to D1. Singleton built by a factory closure
 * (Svelte 5 `$state` is declaration-scoped, so reactive fields live inside the
 * factory and are exposed via getters).
 *
 * Persistence: mutations update local `$state` immutably and persist via the API
 * — text edits (title/note) through keyed debounceSync, structural changes
 * (targetAt/hasTime/archived/order/share) immediately via sync(). hydrate() runs
 * exactly ONCE in +page.svelte under untrack(); do not add a second hydrate path.
 *
 * Derived partitions read `clock.now`, so the board re-partitions itself the
 * instant a countdown crosses zero (upcoming → past). `ai*` methods mutate local
 * state only and exist so the AI copilot can reflect its API writes on the board.
 */
import type { Countdown, CountdownInput, CountdownPatch } from "$lib/types";
import { api, debounceSync, sync } from "$lib/api/client";
import { clock } from "./clock.svelte";

const TEXT_DEBOUNCE_MS = 400;
const TEXT_KEYS = new Set<keyof CountdownPatch>(["title", "note"]);

const isTextOnlyPatch = (patch: CountdownPatch): boolean => {
	const keys = Object.keys(patch);
	return keys.length > 0 && keys.every((k) => TEXT_KEYS.has(k as keyof CountdownPatch));
};

const applyPatch = (c: Countdown, patch: CountdownPatch): Countdown => ({
	...c,
	...(patch.title !== undefined ? { title: patch.title } : {}),
	...(patch.targetAt !== undefined ? { targetAt: patch.targetAt } : {}),
	...(patch.hasTime !== undefined ? { hasTime: patch.hasTime } : {}),
	...(patch.note !== undefined ? { note: patch.note } : {}),
	...(patch.archived !== undefined ? { archived: patch.archived } : {})
});

const ms = (iso: string): number => Date.parse(iso);

const createCountdownsStore = () => {
	let countdowns = $state<Countdown[]>([]);

	const hydrate = (initial: { countdowns: Countdown[] }) => {
		countdowns = initial.countdowns;
	};

	const add = async (input: CountdownInput): Promise<Countdown | null> => {
		const created = await sync(() => api.post<Countdown>("/api/countdowns", input));
		if (!created) return null;
		countdowns = [...countdowns, created];
		return created;
	};

	const update = (id: string, patch: CountdownPatch) => {
		countdowns = countdowns.map((c) => (c.id === id ? applyPatch(c, patch) : c));
		const send = () => api.patch<void>(`/api/countdowns/${id}`, patch);
		if (isTextOnlyPatch(patch)) {
			debounceSync(`cd:${id}`, TEXT_DEBOUNCE_MS, send);
		} else {
			void sync(send);
		}
	};

	const setArchived = (id: string, archived: boolean) => update(id, { archived });

	const remove = (id: string) => {
		countdowns = countdowns.filter((c) => c.id !== id);
		void sync(() => api.delete<void>(`/api/countdowns/${id}`));
	};

	// Reorders local state to match orderedIds (appending any unlisted survivors),
	// then persists the new order. Used by drag-reorder on the board.
	const reorder = (orderedIds: string[]) => {
		const byId = new Map(countdowns.map((c) => [c.id, c]));
		const next: Countdown[] = [];
		for (const id of orderedIds) {
			const c = byId.get(id);
			if (c) next.push(c);
		}
		for (const c of countdowns) {
			if (!orderedIds.includes(c.id)) next.push(c);
		}
		countdowns = next;
		void sync(() => api.put<void>("/api/countdowns", { orderedIds }));
	};

	// Returns the share token (or null when disabled). On enable failure the local
	// state is left unchanged; disable is applied optimistically.
	const setShare = async (id: string, enabled: boolean): Promise<string | null> => {
		if (enabled) {
			const res = await sync(() =>
				api.post<{ shareToken: string; url: string }>(`/api/countdowns/${id}/share`)
			);
			if (!res) return null;
			countdowns = countdowns.map((c) => (c.id === id ? { ...c, shareToken: res.shareToken } : c));
			return res.shareToken;
		}
		countdowns = countdowns.map((c) => (c.id === id ? { ...c, shareToken: null } : c));
		void sync(() => api.delete<void>(`/api/countdowns/${id}/share`));
		return null;
	};

	const getById = (id: string): Countdown | undefined => countdowns.find((c) => c.id === id);

	// ── AI copilot local mutators (state only; the copilot persists via the API) ──
	const aiInject = (c: Countdown) => {
		const exists = countdowns.some((x) => x.id === c.id);
		countdowns = exists ? countdowns.map((x) => (x.id === c.id ? c : x)) : [...countdowns, c];
	};
	const aiRemove = (id: string) => {
		countdowns = countdowns.filter((c) => c.id !== id);
	};

	const active = $derived(countdowns.filter((c) => !c.archived));
	const upcoming = $derived.by(() => {
		const now = clock.now;
		return active
			.filter((c) => ms(c.targetAt) > now)
			.sort((a, b) => ms(a.targetAt) - ms(b.targetAt));
	});
	const past = $derived.by(() => {
		const now = clock.now;
		return active
			.filter((c) => ms(c.targetAt) <= now)
			.sort((a, b) => ms(b.targetAt) - ms(a.targetAt));
	});
	const archivedList = $derived(countdowns.filter((c) => c.archived));
	const hero = $derived(upcoming[0] ?? null);

	return {
		get all() {
			return countdowns;
		},
		get active() {
			return active;
		},
		get upcoming() {
			return upcoming;
		},
		get past() {
			return past;
		},
		get archived() {
			return archivedList;
		},
		get hero() {
			return hero;
		},
		hydrate,
		add,
		update,
		setArchived,
		remove,
		reorder,
		setShare,
		getById,
		aiInject,
		aiRemove
	};
};

export const countdowns = createCountdownsStore();
