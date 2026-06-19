/**
 * The ONLY module permitted to import GSAP. getGsap() performs a browser-guarded
 * dynamic import() of gsap + ScrollTrigger + Flip, registers the plugins and sets
 * defaults exactly once, then memoizes the bundle (concurrent callers share the
 * one in-flight `loading` promise).
 *
 * INVARIANT: never write a top-level `import ... from "gsap"` anywhere — GSAP
 * touches window/document at module-eval time, which breaks SSR on Cloudflare
 * Workers. Returns null on the server. peekGsap() is the sync, non-loading peek.
 */
import { browser } from "$app/environment";
import { DURATION, EASE } from "$lib/motion/tokens";

type GsapModule = (typeof import("gsap"))["gsap"];
type ScrollTriggerModule = (typeof import("gsap/ScrollTrigger"))["ScrollTrigger"];
type FlipModule = (typeof import("gsap/Flip"))["Flip"];

export interface GsapBundle {
	gsap: GsapModule;
	ScrollTrigger: ScrollTriggerModule;
	Flip: FlipModule;
}

let bundle: GsapBundle | null = null;
let loading: Promise<GsapBundle> | null = null;

const load = async (): Promise<GsapBundle> => {
	const [{ gsap }, { ScrollTrigger }, { Flip }] = await Promise.all([
		import("gsap"),
		import("gsap/ScrollTrigger"),
		import("gsap/Flip")
	]);

	gsap.registerPlugin(ScrollTrigger, Flip);
	gsap.defaults({ ease: EASE.standard, duration: DURATION.base });

	bundle = { gsap, ScrollTrigger, Flip };
	return bundle;
};

export const getGsap = async (): Promise<GsapBundle | null> => {
	if (!browser) return null;
	if (bundle) return bundle;
	if (!loading) loading = load();
	return loading;
};

export const peekGsap = (): GsapBundle | null => bundle;
