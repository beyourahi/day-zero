/**
 * Pure, SSR-safe time math for the countdown board. `now` is always passed in
 * (never read from the clock here) so these functions are deterministic and
 * unit-testable, and the server render matches the first client paint.
 *
 * GRANULARITY RULE (tune the constants below to change the feel):
 *  - ≥ 1 day remaining → show Days / Hours / Minutes. Seconds are added only for
 *    timed goals (hasTime) and only within FINE_STRETCH_DAYS, because a ticking
 *    seconds digit on a goal months away is noise and a date-only goal has no
 *    meaningful sub-day precision.
 *  - < 1 day remaining → always show Hours / Minutes / Seconds (the final stretch
 *    earns the live seconds).
 */

const MS = { sec: 1000, min: 60_000, hour: 3_600_000, day: 86_400_000 } as const;

/** Within this many days, a timed goal also shows a live seconds segment. */
const FINE_STRETCH_DAYS = 30;

export interface RemainingSegment {
	value: number;
	/** Already pluralized / short unit label, lowercase. */
	label: string;
	/** Stable key for #each. */
	unit: "days" | "hours" | "minutes" | "seconds";
}

export interface Remaining {
	/** Signed ms until target (negative once reached). */
	total: number;
	isPast: boolean;
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
	/** Adaptive list of segments to render, largest unit first. */
	segments: RemainingSegment[];
}

const pluralize = (value: number, singular: string): string =>
	value === 1 ? singular : `${singular}s`;

/**
 * Breaks the absolute distance between `now` and `targetAtMs` into D/H/M/S and
 * the adaptive segment list. Works symmetrically for past targets (isPast true).
 */
export const remaining = (targetAtMs: number, now: number, hasTime: boolean): Remaining => {
	const total = targetAtMs - now;
	const abs = Math.abs(total);

	const days = Math.floor(abs / MS.day);
	const hours = Math.floor((abs % MS.day) / MS.hour);
	const minutes = Math.floor((abs % MS.hour) / MS.min);
	const seconds = Math.floor((abs % MS.min) / MS.sec);

	const segments: RemainingSegment[] = [];
	if (days >= 1) {
		segments.push({ value: days, label: pluralize(days, "day"), unit: "days" });
		segments.push({ value: hours, label: pluralize(hours, "hr"), unit: "hours" });
		segments.push({ value: minutes, label: pluralize(minutes, "min"), unit: "minutes" });
		if (hasTime && days < FINE_STRETCH_DAYS) {
			segments.push({ value: seconds, label: pluralize(seconds, "sec"), unit: "seconds" });
		}
	} else {
		segments.push({ value: hours, label: pluralize(hours, "hr"), unit: "hours" });
		segments.push({ value: minutes, label: pluralize(minutes, "min"), unit: "minutes" });
		segments.push({ value: seconds, label: pluralize(seconds, "sec"), unit: "seconds" });
	}

	return { total, isPast: total <= 0, days, hours, minutes, seconds, segments };
};

/** Zero-pads a unit value to at least two digits for the ticking display. */
export const pad2 = (n: number): string => String(n).padStart(2, "0");

/**
 * Compact one-line summary for dense contexts (cards collapsed, share preview
 * meta). e.g. "in 3 days", "in 12h 04m", "reached", "2 days ago".
 */
export const humanize = (targetAtMs: number, now: number, hasTime: boolean): string => {
	const r = remaining(targetAtMs, now, hasTime);
	if (r.total <= 0) {
		if (r.days >= 1) return `${r.days} ${pluralize(r.days, "day")} ago`;
		if (r.hours >= 1) return `${r.hours}h ago`;
		return "reached";
	}
	if (r.days >= 1) return `in ${r.days} ${pluralize(r.days, "day")}`;
	if (r.hours >= 1) return `in ${r.hours}h ${pad2(r.minutes)}m`;
	if (r.minutes >= 1) return `in ${r.minutes}m`;
	return "any moment now";
};

const dateOnlyFmt = new Intl.DateTimeFormat("en-US", {
	weekday: "short",
	month: "short",
	day: "numeric",
	year: "numeric"
});
const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
	weekday: "short",
	month: "short",
	day: "numeric",
	year: "numeric",
	hour: "numeric",
	minute: "2-digit"
});

/** Absolute, locale-formatted target label for the eyebrow (e.g. "Fri, Sep 11, 2026"). */
export const formatTargetDate = (iso: string, hasTime: boolean): string => {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return (hasTime ? dateTimeFmt : dateOnlyFmt).format(d);
};
