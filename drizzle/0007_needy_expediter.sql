CREATE TABLE `preference_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`metrics` text NOT NULL,
	`defaultFrequency` enum('weekly','biweekly','monthly','quarterly','annually') NOT NULL,
	`defaultHour` int NOT NULL,
	`defaultMinute` int NOT NULL,
	`defaultDayOfMonth` int NOT NULL,
	`changeDescription` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `preference_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `version_user_idx` ON `preference_versions` (`userId`);--> statement-breakpoint
CREATE INDEX `version_number_idx` ON `preference_versions` (`userId`,`versionNumber`);--> statement-breakpoint
CREATE INDEX `version_created_idx` ON `preference_versions` (`createdAt`);