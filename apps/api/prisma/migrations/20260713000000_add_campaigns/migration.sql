CREATE TABLE `Campaign` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `type` ENUM('BUY_2_GET_2') NOT NULL DEFAULT 'BUY_2_GET_2',
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `showOnHomepage` BOOLEAN NOT NULL DEFAULT false,
  `startsAt` DATETIME(3) NULL,
  `endsAt` DATETIME(3) NULL,
  `bannerTitle` VARCHAR(191) NULL,
  `bannerText` TEXT NULL,
  `bannerButtonText` VARCHAR(191) NULL,
  `bannerButtonHref` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `Campaign_slug_key` (`slug`),
  INDEX `Campaign_type_isActive_idx` (`type`, `isActive`),
  INDEX `Campaign_showOnHomepage_isActive_idx` (`showOnHomepage`, `isActive`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `OrderItem`
  ADD COLUMN `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `isGift` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `campaignId` INTEGER NULL;

CREATE INDEX `OrderItem_campaignId_idx` ON `OrderItem` (`campaignId`);

ALTER TABLE `OrderItem`
  ADD CONSTRAINT `OrderItem_campaignId_fkey`
  FOREIGN KEY (`campaignId`) REFERENCES `Campaign`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
