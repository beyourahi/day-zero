// Vite build config. Tailwind v4 is wired CSS-first through @tailwindcss/vite — there is
// no tailwind.config.js; theme tokens live in src/app.css under @theme. The es2022 build
// target matches the Node/Worker runtime floor declared in package.json engines.
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		target: "es2022"
	}
});
