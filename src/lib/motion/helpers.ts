/**
 * Higher-level motion helpers built on getGsap(). All three honor reduced-motion
 * by degrading to no-ops/zero (returning a no-op cleanup so call sites stay
 * uniform). Callers must invoke the returned cleanup to kill tweens on destroy.
 */
import { tick } from "svelte";
import { getGsap } from "$lib/motion/gsap";
import { prefersReducedMotion } from "$lib/motion/reduced-motion.svelte";
import { DURATION, DURATION_MS, EASE, STAGGER, DISTANCE } from "$lib/motion/tokens";
import type { DurationToken, DistanceToken, StaggerToken } from "$lib/motion/tokens";

export interface StaggerOptions {
	distance?: DistanceToken;
	duration?: DurationToken;
	amount?: StaggerToken;
}

export const stagger = async (
	targets: ArrayLike<Element>,
	options?: StaggerOptions
): Promise<() => void> => {
	if (prefersReducedMotion.current) return () => {};

	const els = Array.from(targets) as HTMLElement[];
	if (els.length === 0) return () => {};

	for (const el of els) el.style.opacity = "0";

	const loaded = await getGsap();
	if (!loaded) {
		for (const el of els) el.style.opacity = "";
		return () => {};
	}

	const tween = loaded.gsap.fromTo(
		els,
		{ opacity: 0, y: DISTANCE[options?.distance ?? "sm"] },
		{
			opacity: 1,
			y: 0,
			duration: DURATION[options?.duration ?? "base"],
			ease: EASE.decelerate,
			stagger: STAGGER[options?.amount ?? "base"],
			clearProps: "opacity,transform"
		}
	);

	return () => tween.kill();
};

// GSAP Flip for add/remove/reorder list motion. Call BEFORE the DOM mutation to
// snapshot `container.children`; the returned function awaits Svelte's `tick()`
// (so the new DOM is committed) then animates from the captured state.
export const flipList = async (container: Element): Promise<() => Promise<void>> => {
	if (prefersReducedMotion.current) return async () => {};

	const loaded = await getGsap();
	if (!loaded) return async () => {};

	const { gsap, Flip } = loaded;
	const state = Flip.getState(container.children);

	return async () => {
		await tick();
		Flip.from(state, {
			duration: DURATION.base,
			ease: EASE.emphasized,
			absolute: true,
			onEnter: (els) => gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: DURATION.fast }),
			onLeave: (els) => gsap.to(els, { opacity: 0, duration: DURATION.fast })
		});
	};
};

// Duration in ms for Svelte transitions; returns 0 under reduced-motion so the
// transition completes instantly rather than being skipped entirely.
export const motionDuration = (token: DurationToken = "base"): number =>
	prefersReducedMotion.current ? 0 : DURATION_MS[token];
