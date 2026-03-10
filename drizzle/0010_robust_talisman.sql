CREATE TABLE `sms_campaign_delivery` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`recipientId` int NOT NULL,
	`messageId` varchar(255),
	`status` enum('queued','sent','delivered','failed','bounced') NOT NULL DEFAULT 'queued',
	`errorCode` varchar(50),
	`errorMessage` text,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_campaign_delivery_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_campaign_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`tenantId` int NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`status` enum('pending','sent','delivered','failed','bounced') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_campaign_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_campaign_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`messageTemplate` text NOT NULL,
	`category` enum('maintenance','payment','announcement','emergency','other') NOT NULL DEFAULT 'other',
	`variables` text,
	`isPublic` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sms_campaign_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`messageTemplate` text NOT NULL,
	`status` enum('draft','scheduled','sent','cancelled') NOT NULL DEFAULT 'draft',
	`recipientCount` int DEFAULT 0,
	`sentCount` int DEFAULT 0,
	`deliveredCount` int DEFAULT 0,
	`failedCount` int DEFAULT 0,
	`scheduledTime` timestamp,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sms_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `delivery_campaign_idx` ON `sms_campaign_delivery` (`campaignId`);--> statement-breakpoint
CREATE INDEX `delivery_recipient_idx` ON `sms_campaign_delivery` (`recipientId`);--> statement-breakpoint
CREATE INDEX `delivery_status_idx` ON `sms_campaign_delivery` (`status`);--> statement-breakpoint
CREATE INDEX `delivery_sent_idx` ON `sms_campaign_delivery` (`sentAt`);--> statement-breakpoint
CREATE INDEX `recipient_campaign_idx` ON `sms_campaign_recipients` (`campaignId`);--> statement-breakpoint
CREATE INDEX `recipient_tenant_idx` ON `sms_campaign_recipients` (`tenantId`);--> statement-breakpoint
CREATE INDEX `recipient_status_idx` ON `sms_campaign_recipients` (`status`);--> statement-breakpoint
CREATE INDEX `template_user_idx` ON `sms_campaign_templates` (`userId`);--> statement-breakpoint
CREATE INDEX `template_category_idx` ON `sms_campaign_templates` (`category`);--> statement-breakpoint
CREATE INDEX `campaign_user_idx` ON `sms_campaigns` (`userId`);--> statement-breakpoint
CREATE INDEX `campaign_status_idx` ON `sms_campaigns` (`status`);--> statement-breakpoint
CREATE INDEX `campaign_scheduled_idx` ON `sms_campaigns` (`scheduledTime`);