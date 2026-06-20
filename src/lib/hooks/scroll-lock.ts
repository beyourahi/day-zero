/**
 * Imperative scroll lock for modal surfaces.
 *
 * Locks the *viewport* scroller — which in this app is <html>, not <body>.
 * `app.css` sets `html { overflow-x: clip }`; a non-visible root overflow stops
 * the browser from propagating `body { overflow: hidden }` to the viewport, so
 * bits-ui's built-in (body-based) `preventScroll` is silently defeated and the
 * page keeps scrolling behind an open dialog. We therefore lock the
 * documentElement directly and compensate the reclaimed scrollbar width with
 * body padding so nothing shifts on open/close.
 *
 * Ref-counted, so stacked/parallel locks compose and only the last release
 * restores. Each call returns an idempotent release fn. SSR/no-DOM safe (no-op).
 */
let locks = 0;
let restore: (() => void) | null = null;

export const lockScroll = (): (() => void) => {
	if (typeof document === "undefined") return () => {};

	if (locks === 0) {
		const root = document.documentElement;
		const body = document.body;
		// Width the scrollbar occupies; reclaimed when we hide the root overflow.
		const scrollbar = window.innerWidth - root.clientWidth;
		const prevRootOverflow = root.style.overflow;
		const prevBodyPaddingRight = body.style.paddingRight;

		root.style.overflow = "hidden";
		if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

		restore = () => {
			root.style.overflow = prevRootOverflow;
			body.style.paddingRight = prevBodyPaddingRight;
		};
	}
	locks += 1;

	let released = false;
	return () => {
		if (released) return;
		released = true;
		locks -= 1;
		if (locks === 0 && restore) {
			restore();
			restore = null;
		}
	};
};
