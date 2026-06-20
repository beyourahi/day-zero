CREATE TABLE `user_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`cloudflare_token_encrypted` blob,
	`cloudflare_account_id` text,
	`cloudflare_model` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
