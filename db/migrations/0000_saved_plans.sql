CREATE TABLE IF NOT EXISTS `saved_plans` (
  `id` text PRIMARY KEY NOT NULL,
  `owner_id` text NOT NULL,
  `title` text NOT NULL,
  `finish_at_ms` integer NOT NULL,
  `tasks_json` text NOT NULL,
  `version` integer DEFAULT 1 NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `saved_plans_owner_id_id_idx`
  ON `saved_plans` (`owner_id`, `id`);
