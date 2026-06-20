// SvelteKit config. Deploys to Cloudflare Workers via adapter-cloudflare; platformProxy
// (below) binds `event.platform.env` — DB, AI, VECTORIZE, AI_QUOTA_KV — to wrangler.jsonc
// during dev/preview so server code sees the same bindings it gets in production.
import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		alias: {
			// $src → src/ lets route files import src/components/* without relative paths.
			// ($lib → src/lib/ is SvelteKit's default and intentionally not redeclared here.)
			$src: "src"
		},
		// CSRF: allow cross-origin form POSTs from the dev/preview ports and the branded
		// production origin. The same-origin request always passes; these cover Vite dev
		// (5173), Wrangler preview (8787), and the custom domain.
		csrf: {
			trustedOrigins: [
				"http://localhost:5173",
				"http://localhost:8787",
				"https://day-zero.dropoutstudio.co"
			]
		},
		adapter: adapter({
			platformProxy: {
				configPath: "wrangler.jsonc"
			},
			routes: {
				include: ["/*"],
				exclude: ["<all>"]
			}
		})
	}
};

export default config;
