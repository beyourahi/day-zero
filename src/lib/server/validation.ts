/**
 * Shared Zod schemas for /api/* request bodies, fed to parseJson (api.ts).
 * Patch schema .refine()s to reject empty bodies. `targetAt` is validated as a
 * parseable ISO-8601 datetime string (version-agnostic: Date.parse, not the zod
 * datetime() helper) and is the absolute instant stored in D1.
 */
import { z } from "zod";

const isoDateTime = z
	.string()
	.min(1, "Target date is required")
	.refine((s) => !Number.isNaN(Date.parse(s)), "Invalid target date");

export const createCountdownSchema = z.object({
	title: z.string().trim().min(1, "Give it a title").max(120),
	targetAt: isoDateTime,
	hasTime: z.boolean().optional(),
	note: z.string().max(500).optional()
});

export const updateCountdownSchema = z
	.object({
		title: z.string().trim().min(1).max(120).optional(),
		targetAt: isoDateTime.optional(),
		hasTime: z.boolean().optional(),
		note: z.string().max(500).optional(),
		archived: z.boolean().optional()
	})
	.refine((v) => Object.keys(v).length > 0, { message: "Empty patch" });

export const reorderSchema = z.object({
	orderedIds: z.array(z.string()).max(500)
});

export const shareSchema = z.object({
	enabled: z.boolean()
});
