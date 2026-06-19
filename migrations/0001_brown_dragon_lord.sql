CREATE TABLE `ai_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`conversation_id` text,
	`message_id` text,
	`tool_name` text NOT NULL,
	`inputs` text NOT NULL,
	`inverse` text NOT NULL,
	`safety_tier` text NOT NULL,
	`required_confirmation` integer NOT NULL,
	`anomaly_triggered` text,
	`applied` integer NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`created_at` integer NOT NULL,
	`undone_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`message_id`) REFERENCES `ai_messages`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ai_actions_user_created_idx` ON `ai_actions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ai_actions_user_status_idx` ON `ai_actions` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `ai_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ai_conversations_user_updated_idx` ON `ai_conversations` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `ai_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`tool_calls` text,
	`tool_results` text,
	`input_tokens` integer,
	`output_tokens` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ai_messages_conversation_created_idx` ON `ai_messages` (`conversation_id`,`created_at`);