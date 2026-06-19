// ESLint flat config. Layers JS + typescript-eslint + eslint-plugin-svelte recommended
// rules; eslint-config-prettier comes last so Prettier owns all formatting. .svelte and
// .svelte.ts files are parsed with the TS parser; identifiers prefixed with `_` are exempt
// from no-unused-vars. Build output and the generated worker types file are ignored.
import js from "@eslint/js";
import ts from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs["flat/recommended"],
	prettier,
	...svelte.configs["flat/prettier"],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ["**/*.svelte"],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		},
		rules: {
			"svelte/no-navigation-without-resolve": "off"
		}
	},
	{
		files: ["**/*.svelte.ts"],
		languageOptions: {
			parser: ts.parser
		}
	},
	{
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_"
				}
			]
		}
	},
	{
		ignores: ["build/", ".svelte-kit/", "dist/", ".wrangler/", "worker-configuration.d.ts"]
	}
);
