-- AlterTable: make passwordHash nullable (for Google OAuth users)
ALTER TABLE `User` MODIFY COLUMN `passwordHash` VARCHAR(191) NULL;

-- AlterTable: add Google OAuth and password reset fields
ALTER TABLE `User`
  ADD COLUMN `googleId` VARCHAR(191) NULL,
  ADD COLUMN `resetPasswordToken` VARCHAR(64) NULL,
  ADD COLUMN `resetPasswordExpires` DATETIME(3) NULL;

-- CreateIndex: googleId must be unique
CREATE UNIQUE INDEX `User_googleId_key` ON `User`(`googleId`);
