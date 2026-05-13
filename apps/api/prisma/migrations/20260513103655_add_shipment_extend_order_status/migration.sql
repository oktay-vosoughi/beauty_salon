-- AlterTable: extend OrderStatus enum to include SHIPPED and DELIVERED
ALTER TABLE `Order` MODIFY COLUMN `status` ENUM('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE `Shipment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `keShipmentId` INTEGER NULL,
    `cargoIntegrationId` INTEGER NULL,
    `cargoCompanyName` VARCHAR(191) NULL,
    `trackingNumber` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'NEW',
    `note` TEXT NULL,
    `rawResponseJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `syncedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Shipment_orderId_key`(`orderId`),
    INDEX `Shipment_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- AddForeignKey
ALTER TABLE `Shipment` ADD CONSTRAINT `Shipment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
