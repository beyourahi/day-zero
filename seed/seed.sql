-- Day Zero — local dev seed (idempotent). Populates the E2E_BYPASS_AUTH test user's board.
-- Run: bun run seed   (→ wrangler d1 execute day_zero --local --file ./seed/seed.sql)
-- NEVER run against --remote / production. Fixed ids + INSERT OR REPLACE = re-runnable.
-- Dates are relative to now (unixepoch → seconds, matching Drizzle mode:"timestamp"),
-- so the board stays evergreen: a soonest upcoming goal becomes the hero, one reached goal
-- falls into the "past" section. Owner is the synthesized bypass user (e2e-test-user).

INSERT OR IGNORE INTO users (id, email, email_verified, name, image, created_at, updated_at)
VALUES ('e2e-test-user', 'e2e@test.local', 1, 'E2E Test User', NULL, unixepoch('now'), unixepoch('now'));

-- Soonest upcoming → promoted to the oversized hero.
INSERT OR REPLACE INTO countdowns (id, user_id, title, target_at, has_time, share_token, position, created_at, updated_at)
VALUES ('seed-cd-1', 'e2e-test-user', 'Dropout free-tools launch week', unixepoch('now', '+7 days'),  0, NULL, 0, unixepoch('now'), unixepoch('now'));

INSERT OR REPLACE INTO countdowns (id, user_id, title, target_at, has_time, share_token, position, created_at, updated_at)
VALUES ('seed-cd-2', 'e2e-test-user', 'Client storefronts #3–10 shipped', unixepoch('now', '+21 days'), 0, NULL, 1, unixepoch('now'), unixepoch('now'));

INSERT OR REPLACE INTO countdowns (id, user_id, title, target_at, has_time, share_token, position, created_at, updated_at)
VALUES ('seed-cd-3', 'e2e-test-user', 'Horcrux SaaS launch', unixepoch('now', '+68 days'), 1, NULL, 2, unixepoch('now'), unixepoch('now'));

INSERT OR REPLACE INTO countdowns (id, user_id, title, target_at, has_time, share_token, position, created_at, updated_at)
VALUES ('seed-cd-4', 'e2e-test-user', 'First 1 lakh MRR month', unixepoch('now', '+120 days'), 0, NULL, 3, unixepoch('now'), unixepoch('now'));

-- Already reached → falls into the quieter "past" section.
INSERT OR REPLACE INTO countdowns (id, user_id, title, target_at, has_time, share_token, position, created_at, updated_at)
VALUES ('seed-cd-5', 'e2e-test-user', 'MVP scope locked', unixepoch('now', '-3 days'), 0, NULL, 4, unixepoch('now', '-30 days'), unixepoch('now', '-30 days'));
