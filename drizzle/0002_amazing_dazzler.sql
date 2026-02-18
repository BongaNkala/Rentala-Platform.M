CREATE TABLE `video_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`userId` int,
	`format` enum('webm','hevc','mp4') NOT NULL,
	`loadTime` int,
	`playbackTime` int,
	`browserName` varchar(100),
	`browserVersion` varchar(50),
	`osName` varchar(100),
	`osVersion` varchar(50),
	`deviceType` enum('desktop','tablet','mobile') DEFAULT 'desktop',
	`screenResolution` varchar(50),
	`connectionSpeed` varchar(50),
	`pageUrl` varchar(512),
	`referrer` varchar(512),
	`ipAddress` varchar(45),
	`country` varchar(100),
	`region` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `video_format_idx` ON `video_analytics` (`format`);--> statement-breakpoint
CREATE INDEX `video_user_idx` ON `video_analytics` (`userId`);--> statement-breakpoint
CREATE INDEX `video_session_idx` ON `video_analytics` (`sessionId`);--> statement-breakpoint
CREATE INDEX `video_created_idx` ON `video_analytics` (`createdAt`);--> statement-breakpoint
CREATE INDEX `video_device_idx` ON `video_analytics` (`deviceType`);