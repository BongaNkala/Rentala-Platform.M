CREATE TABLE `tenant_satisfaction_surveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`propertyId` int NOT NULL,
	`leaseId` int,
	`overallSatisfaction` int NOT NULL,
	`cleanliness` int,
	`maintenance` int,
	`communication` int,
	`responsiveness` int,
	`valueForMoney` int,
	`comments` longtext,
	`wouldRecommend` boolean,
	`surveyDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenant_satisfaction_surveys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `satisfaction_tenant_idx` ON `tenant_satisfaction_surveys` (`tenantId`);--> statement-breakpoint
CREATE INDEX `satisfaction_property_idx` ON `tenant_satisfaction_surveys` (`propertyId`);--> statement-breakpoint
CREATE INDEX `satisfaction_date_idx` ON `tenant_satisfaction_surveys` (`surveyDate`);