CREATE TABLE `report_delivery_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleId` int NOT NULL,
	`userId` int NOT NULL,
	`propertyId` int,
	`recipientEmail` varchar(320) NOT NULL,
	`status` enum('pending','sent','failed','bounced') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`pdfUrl` varchar(512),
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `report_delivery_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`propertyId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`frequency` enum('weekly','biweekly','monthly','quarterly','annually') NOT NULL,
	`dayOfWeek` int,
	`dayOfMonth` int,
	`hour` int DEFAULT 9,
	`minute` int DEFAULT 0,
	`recipientEmails` text NOT NULL,
	`metrics` text NOT NULL,
	`status` enum('active','paused','completed') NOT NULL DEFAULT 'active',
	`lastSentAt` timestamp,
	`nextSendAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `report_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `delivery_schedule_idx` ON `report_delivery_history` (`scheduleId`);--> statement-breakpoint
CREATE INDEX `delivery_user_idx` ON `report_delivery_history` (`userId`);--> statement-breakpoint
CREATE INDEX `delivery_status_idx` ON `report_delivery_history` (`status`);--> statement-breakpoint
CREATE INDEX `delivery_sent_idx` ON `report_delivery_history` (`sentAt`);--> statement-breakpoint
CREATE INDEX `schedule_user_idx` ON `report_schedules` (`userId`);--> statement-breakpoint
CREATE INDEX `schedule_property_idx` ON `report_schedules` (`propertyId`);--> statement-breakpoint
CREATE INDEX `schedule_status_idx` ON `report_schedules` (`status`);--> statement-breakpoint
CREATE INDEX `schedule_next_send_idx` ON `report_schedules` (`nextSendAt`);