<!--
	Decorative animated Copilot glyph. `grid` (2×2 boxes) for the mobile FAB, `row` (4 bars) for
	the sidebar header and welcome screen. Purely CSS-animated; aria-hidden as it carries no meaning.
-->
<script lang="ts">
	let { variant = "grid", class: className = "" }: { variant?: "grid" | "row"; class?: string } = $props();
</script>

{#if variant === "row"}
	<div class={`launcher-icon-row launcher-idle-row ${className}`} aria-hidden="true">
		<div></div>
		<div></div>
		<div></div>
		<div></div>
	</div>
{:else}
	<div class={`launcher-icon launcher-idle ${className}`} aria-hidden="true">
		<div class="launcher-box-a"></div>
		<div class="launcher-box-b"></div>
		<div class="launcher-box-c"></div>
		<div class="launcher-box-d"></div>
	</div>
{/if}
