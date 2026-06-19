/**
 * Sliding-window context trimming for the chat history sent to the model.
 * Keeps token cost bounded by only forwarding the most recent turns.
 */

export interface HistoryMessage {
	role: "user" | "assistant" | "system";
	content: string;
}

export const WINDOW_SIZE = 12;

/** Returns the last `windowSize` messages, preserving order; pass-through when already within budget. */
export const windowHistory = (
	messages: HistoryMessage[],
	windowSize = WINDOW_SIZE
): HistoryMessage[] => {
	if (messages.length <= windowSize) return messages;
	return messages.slice(-windowSize);
};
