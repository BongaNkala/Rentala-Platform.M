CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`metrics` text NOT NULL,
	`defaultFrequency` enum('weekly','biweekly','monthly','quarterly','annually') NOT NULL DEFAULT 'monthly',
	`defaultHour` int NOT NULL DEFAULT 9,
	`defaultMinute` int NOT NULL DEFAULT 0,
	`defaultDayOfMonth` int NOT NULL DEFAULT 1,
	`syncedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `preferences_user_idx` ON `user_preferences` (`userId`);--> statement-breakpoint
CREATE INDEX `preferences_synced_idx` ON `user_preferences` (`syncedAt`);