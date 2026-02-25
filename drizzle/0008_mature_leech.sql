CREATE TABLE `report_failures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleId` int NOT NULL,
	`userId` int NOT NULL,
	`propertyId` int,
	`failureReason` enum('email_delivery','pdf_generation','invalid_recipient','network_error','unknown') NOT NULL,
	`errorMessage` text,
	`failureCount` int DEFAULT 1,
	`lastFailedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `report_failures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rollback_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`failureId` int NOT NULL,
	`userId` int NOT NULL,
	`suggestedVersionId` int NOT NULL,
	`reason` text NOT NULL,
	`confidence` int NOT NULL,
	`status` enum('pending','accepted','rejected','applied') NOT NULL DEFAULT 'pending',
	`appliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rollback_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `failure_schedule_idx` ON `report_failures` (`scheduleId`);--> statement-breakpoint
CREATE INDEX `failure_user_idx` ON `report_failures` (`userId`);--> statement-breakpoint
CREATE INDEX `failure_reason_idx` ON `report_failures` (`failureReason`);--> statement-breakpoint
CREATE INDEX `failure_last_failed_idx` ON `report_failures` (`lastFailedAt`);--> statement-breakpoint
CREATE INDEX `suggestion_failure_idx` ON `rollback_suggestions` (`failureId`);--> statement-breakpoint
CREATE INDEX `suggestion_user_idx` ON `rollback_suggestions` (`userId`);--> statement-breakpoint
CREATE INDEX `suggestion_status_idx` ON `rollback_suggestions` (`status`);--> statement-breakpoint
CREATE INDEX `suggestion_version_idx` ON `rollback_suggestions` (`suggestedVersionId`);