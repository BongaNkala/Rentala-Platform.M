CREATE TABLE `agencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(20),
	`address` text,
	`city` varchar(100),
	`country` varchar(100) DEFAULT 'South Africa',
	`logo` varchar(512),
	`website` varchar(512),
	`taxId` varchar(50),
	`status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agency_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agencyId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('admin','manager','staff') NOT NULL DEFAULT 'staff',
	`permissions` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agency_users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(255) NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int,
	`changes` longtext,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`propertyId` int NOT NULL,
	`leaseId` int,
	`tenantId` int,
	`staffId` int NOT NULL,
	`inspectionType` enum('move_in','move_out','periodic','maintenance','other') NOT NULL DEFAULT 'periodic',
	`date` date NOT NULL,
	`status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`findings` longtext,
	`damageReport` longtext,
	`images` longtext,
	`estimatedRepairCost` decimal(12,2),
	`notes` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`tenantId` int NOT NULL,
	`propertyId` int NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`rentAmount` decimal(12,2) NOT NULL,
	`deposit` decimal(12,2),
	`depositPaid` boolean DEFAULT false,
	`currency` varchar(3) DEFAULT 'ZAR',
	`rentEscalation` decimal(5,2) DEFAULT '0.00',
	`paymentDueDay` int DEFAULT 1,
	`leaseTerms` longtext,
	`status` enum('active','expired','terminated','pending') NOT NULL DEFAULT 'active',
	`documents` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`propertyId` int NOT NULL,
	`tenantId` int,
	`staffId` int,
	`title` varchar(255) NOT NULL,
	`description` longtext NOT NULL,
	`category` enum('plumbing','electrical','structural','appliances','cleaning','pest_control','other') NOT NULL DEFAULT 'other',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('open','assigned','in_progress','completed','cancelled') NOT NULL DEFAULT 'open',
	`estimatedCost` decimal(12,2),
	`actualCost` decimal(12,2),
	`currency` varchar(3) DEFAULT 'ZAR',
	`images` longtext,
	`notes` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `maintenance_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leaseId` int NOT NULL,
	`unitId` int NOT NULL,
	`tenantId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'ZAR',
	`dueDate` date NOT NULL,
	`paidDate` date,
	`status` enum('pending','partial','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` enum('bank_transfer','cash','cheque','card','eft','other') DEFAULT 'bank_transfer',
	`reference` varchar(255),
	`notes` text,
	`receiptUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agencyId` int,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`city` varchar(100) NOT NULL,
	`province` varchar(100),
	`country` varchar(100) DEFAULT 'South Africa',
	`postalCode` varchar(10),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`propertyType` enum('residential','commercial','mixed') NOT NULL DEFAULT 'residential',
	`status` enum('active','inactive','for_sale') NOT NULL DEFAULT 'active',
	`totalUnits` int DEFAULT 1,
	`description` longtext,
	`images` longtext,
	`documents` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`idNumber` varchar(50) NOT NULL,
	`idType` enum('national_id','passport','drivers_license') NOT NULL DEFAULT 'national_id',
	`dateOfBirth` date,
	`nationality` varchar(100),
	`emergencyContact` varchar(100),
	`emergencyPhone` varchar(20),
	`employmentStatus` enum('employed','self_employed','unemployed','student','retired') DEFAULT 'employed',
	`employer` varchar(255),
	`monthlyIncome` decimal(12,2),
	`documents` longtext,
	`profileImage` varchar(512),
	`status` enum('active','inactive','blacklisted') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_idNumber_unique` UNIQUE(`idNumber`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`category` varchar(100) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'ZAR',
	`description` text,
	`date` date NOT NULL,
	`reference` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`unitNumber` varchar(50) NOT NULL,
	`unitType` enum('studio','one_bedroom','two_bedroom','three_bedroom','four_bedroom','five_plus_bedroom','commercial') NOT NULL DEFAULT 'one_bedroom',
	`bedrooms` int DEFAULT 1,
	`bathrooms` int DEFAULT 1,
	`squareFeet` int,
	`rentAmount` decimal(12,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'ZAR',
	`deposit` decimal(12,2),
	`status` enum('vacant','occupied','maintenance','reserved') NOT NULL DEFAULT 'vacant',
	`description` text,
	`amenities` longtext,
	`images` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('super_admin','agency_admin','landlord','staff','tenant') NOT NULL DEFAULT 'tenant';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','inactive','suspended') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `profileImage` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
CREATE INDEX `agency_name_idx` ON `agencies` (`name`);--> statement-breakpoint
CREATE INDEX `agency_user_agency_idx` ON `agency_users` (`agencyId`);--> statement-breakpoint
CREATE INDEX `agency_user_user_idx` ON `agency_users` (`userId`);--> statement-breakpoint
CREATE INDEX `audit_user_idx` ON `audit_log` (`userId`);--> statement-breakpoint
CREATE INDEX `audit_entity_type_idx` ON `audit_log` (`entityType`);--> statement-breakpoint
CREATE INDEX `inspection_unit_idx` ON `inspections` (`unitId`);--> statement-breakpoint
CREATE INDEX `inspection_property_idx` ON `inspections` (`propertyId`);--> statement-breakpoint
CREATE INDEX `inspection_lease_idx` ON `inspections` (`leaseId`);--> statement-breakpoint
CREATE INDEX `inspection_type_idx` ON `inspections` (`inspectionType`);--> statement-breakpoint
CREATE INDEX `lease_unit_idx` ON `leases` (`unitId`);--> statement-breakpoint
CREATE INDEX `lease_tenant_idx` ON `leases` (`tenantId`);--> statement-breakpoint
CREATE INDEX `lease_property_idx` ON `leases` (`propertyId`);--> statement-breakpoint
CREATE INDEX `lease_status_idx` ON `leases` (`status`);--> statement-breakpoint
CREATE INDEX `maintenance_unit_idx` ON `maintenance_requests` (`unitId`);--> statement-breakpoint
CREATE INDEX `maintenance_property_idx` ON `maintenance_requests` (`propertyId`);--> statement-breakpoint
CREATE INDEX `maintenance_status_idx` ON `maintenance_requests` (`status`);--> statement-breakpoint
CREATE INDEX `maintenance_priority_idx` ON `maintenance_requests` (`priority`);--> statement-breakpoint
CREATE INDEX `payment_lease_idx` ON `payments` (`leaseId`);--> statement-breakpoint
CREATE INDEX `payment_tenant_idx` ON `payments` (`tenantId`);--> statement-breakpoint
CREATE INDEX `payment_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `payment_due_date_idx` ON `payments` (`dueDate`);--> statement-breakpoint
CREATE INDEX `property_owner_idx` ON `properties` (`ownerId`);--> statement-breakpoint
CREATE INDEX `property_agency_idx` ON `properties` (`agencyId`);--> statement-breakpoint
CREATE INDEX `property_city_idx` ON `properties` (`city`);--> statement-breakpoint
CREATE INDEX `tenant_email_idx` ON `tenants` (`email`);--> statement-breakpoint
CREATE INDEX `tenant_id_number_idx` ON `tenants` (`idNumber`);--> statement-breakpoint
CREATE INDEX `transaction_property_idx` ON `transactions` (`propertyId`);--> statement-breakpoint
CREATE INDEX `transaction_type_idx` ON `transactions` (`type`);--> statement-breakpoint
CREATE INDEX `transaction_date_idx` ON `transactions` (`date`);--> statement-breakpoint
CREATE INDEX `unit_property_idx` ON `units` (`propertyId`);--> statement-breakpoint
CREATE INDEX `unit_status_idx` ON `units` (`status`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `users` (`role`);