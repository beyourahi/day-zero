/**
 * SSE transport for the chat turn: encode/decode `Frame` objects to/from
 * `data: …\n\n` events. `sseStream` (server) produces the Response; `streamFrames`
 * (client) parses it back into a Frame async-iterable.
 * @see ./types.ts (Frame union), src/routes/api/ai/chat/+server.ts (producer).
 */

import type { Frame } from "./types";

export type { Frame } from "./types";

export const encodeFrame = (frame: Frame): string => `data: ${JSON.stringify(frame)}\n\n`;

export const decodeFrame = (line: string): Frame | null => {
	const trimmed = line.startsWith("data: ") ? line.slice(6).trim() : line.trim();
	if (!trimmed) return null;
	try {
		return JSON.parse(trimmed) as Frame;
	} catch {
		return null;
	}
};

export const streamFrames = async function* (
	stream: ReadableStream<Uint8Array>
): AsyncIterable<Frame> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });

			let separatorIdx = buffer.indexOf("\n\n");
			while (separatorIdx !== -1) {
				const rawEvent = buffer.slice(0, separatorIdx);
				buffer = buffer.slice(separatorIdx + 2);
				const frame = decodeFrame(rawEvent);
				if (frame) yield frame;
				separatorIdx = buffer.indexOf("\n\n");
			}
		}
	} finally {
		reader.releaseLock();
	}
};

/**
 * Wraps a producer in a ReadableStream Response with SSE headers. A producer
 * throw is converted into a final `error` frame rather than tearing the stream;
 * `push` after client disconnect is silently swallowed (controller closed).
 * `x-accel-buffering: no` disables proxy buffering so frames flush immediately.
 */
export const sseStream = (produce: (push: (frame: Frame) => void) => Promise<void>): Response => {
	const encoder = new TextEncoder();
	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			const push = (frame: Frame) => {
				try {
					controller.enqueue(encoder.encode(encodeFrame(frame)));
				} catch {
					// stream closed by client
				}
			};
			try {
				await produce(push);
			} catch (err) {
				push({
					t: "error",
					message: err instanceof Error ? err.message : "Unknown stream error"
				});
			} finally {
				try {
					controller.close();
				} catch {
					// already closed
				}
			}
		}
	});
	return new Response(stream, {
		status: 200,
		headers: {
			"content-type": "text/event-stream",
			"cache-control": "no-cache, no-transform",
			"x-accel-buffering": "no"
		}
	});
};
