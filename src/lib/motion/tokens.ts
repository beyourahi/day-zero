/**
 * Shared motion constants. These values are a CROSS-APP COHESION CONTRACT shared
 * across the workspace's projects — do not change them. DURATION (seconds) feeds
 * GSAP; DURATION_MS (milliseconds) mirrors it for Svelte transitions; keep the
 * two in lockstep. EASE values are GSAP ease strings.
 */
export const DURATION = {
	fast: 0.15,
	base: 0.25,
	slow: 0.35
} as const;

export const DURATION_MS = {
	fast: 150,
	base: 250,
	slow: 350
} as const;

export const EASE = {
	standard: "power2.out",
	emphasized: "power3.inOut",
	decelerate: "expo.out"
} as const;

export const STAGGER = {
	tight: 0.04,
	base: 0.06,
	loose: 0.09
} as const;

export const DISTANCE = {
	sm: 8,
	md: 16
} as const;

export type DurationToken = keyof typeof DURATION;
export type EaseToken = keyof typeof EASE;
export type StaggerToken = keyof typeof STAGGER;
export type DistanceToken = keyof typeof DISTANCE;
