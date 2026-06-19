/**
 * Static app metadata consumed for <title>/<meta> tags. `siblings` are related
 * Dropout tools cross-linked in the UI.
 */
import type { AppConfig } from "$lib/types";

export const APP_CONFIG: AppConfig = {
	name: "Day Zero",
	description: "Track every goal as a live countdown — many milestones, one clean board, no ads.",
	url: "https://day-zero.beyourahi.workers.dev",
	author: {
		name: "Dropout Studio",
		url: "https://dropoutstudio.co"
	},
	siblings: [
		{
			name: "Order Processor",
			url: "https://order-processor.beyourahi.workers.dev"
		},
		{
			name: "Invoice Generator",
			url: "https://invoice-generator.beyourahi.workers.dev"
		}
	]
};
