import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Conditional class merge: clsx resolves truthiness, twMerge dedupes conflicting
// Tailwind utilities (last wins). Standard shadcn-svelte helper.
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type WithElementRef<T, E extends HTMLElement = HTMLElement> = T & {
	ref?: E | null;
};

export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, "children"> : T;

export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, "child"> : T;

export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;

// Triggers a browser download via a synthetic anchor click. Revoking the object
// URL immediately is safe — the browser captures it synchronously on click().
export const downloadBlob = (blob: Blob, fileName: string) => {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	a.click();
	URL.revokeObjectURL(url);
};
