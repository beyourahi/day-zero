/**
 * Public surface of the motion system. Surface/component code imports ONLY from
 * `$lib/motion` — never from `gsap` or the internal modules directly — so the
 * SSR-safe lazy-load and reduced-motion contracts can never be bypassed.
 */
export { DURATION, DURATION_MS, EASE, STAGGER, DISTANCE } from "$lib/motion/tokens";
export type { DurationToken, EaseToken, StaggerToken, DistanceToken } from "$lib/motion/tokens";
export { getGsap, peekGsap } from "$lib/motion/gsap";
export type { GsapBundle } from "$lib/motion/gsap";
export { prefersReducedMotion } from "$lib/motion/reduced-motion.svelte";
export { reveal } from "$lib/motion/actions";
export type { RevealParams } from "$lib/motion/actions";
export { stagger, flipList, motionDuration } from "$lib/motion/helpers";
export type { StaggerOptions } from "$lib/motion/helpers";
export { handleViewTransition, isNavigating } from "$lib/motion/view-transition";
